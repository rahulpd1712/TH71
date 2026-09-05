const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const { db, uuid, seedDatabase } = require('./db');

const app = express();
const PORT = parseInt(process.env.PORT) || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'ayush-secret-key-local';
if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.error('[FATAL] JWT_SECRET is required in production. Set a strong random value, e.g.:');
  console.error('  JWT_SECRET="$(openssl rand -hex 32)" npm start');
  process.exit(1);
}

app.use(cors());
app.use(express.json());

// Seed database on startup
seedDatabase();
// Migration: add status column to cases if missing
try { db.exec("ALTER TABLE cases ADD COLUMN status TEXT DEFAULT 'ongoing'"); } catch(e) {}
try { db.exec("ALTER TABLE users ADD COLUMN phone TEXT"); } catch(e) {}
try { db.exec("ALTER TABLE users ADD COLUMN doctor_id TEXT"); } catch(e) {}
try { db.exec("ALTER TABLE users ADD COLUMN hospital_name TEXT"); } catch(e) {}
try { db.exec("UPDATE users SET role = 'hospital' WHERE role = 'admin'"); } catch(e) {}
try { db.exec('ALTER TABLE patients ADD COLUMN created_by TEXT'); } catch(e) {}
try { db.exec('UPDATE patients SET created_by = (SELECT doctor_id FROM cases WHERE cases.patient_id = patients.id ORDER BY cases.created_at ASC LIMIT 1) WHERE created_by IS NULL'); } catch(e) {}

// Auth middleware
function auth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT id,email,full_name,role,approved,assigned_admin_id,assigned_doctor_id,phone,doctor_id,hospital_name FROM users WHERE id=?').get(decoded.userId);
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user = user;
    next();
  } catch(e) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

function adminOnly(req, res, next) {
  if (req.user.role !== 'super_admin' && req.user.role !== 'admin' && req.user.role !== 'hospital') {
    return res.status(403).json({ error: 'Admin only' });
  }
  next();
}

function superAdminOnly(req, res, next) {
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Super admin only' });
  }
  next();
}

// Row-level visibility: returns the set of user ids whose patients and
// cases the requester may see, or null for unrestricted (super_admin).
//   hospital  -> itself + assigned doctors + their assistants
//   doctor    -> itself + colleagues under the same admin + their assistants
//   assistant -> itself + its own doctor + that doctor's branch
//   legacy admin / unknown -> just itself
function orgMemberIds(user) {
  const r = user;
  const out = [];
  if (r.role === 'super_admin') return null;
  const byAdmin = (adminId) => db.prepare('SELECT id FROM users WHERE assigned_admin_id=?').all(adminId).map(x => x.id);
  const byDoctor = (docIds) => {
    if (!docIds.length) return [];
    const ph = docIds.map(() => '?').join(',');
    return db.prepare('SELECT id FROM users WHERE assigned_doctor_id IN (' + ph + ')').all(...docIds).map(x => x.id);
  };
  if (r.role === 'hospital') {
    const docs = byAdmin(r.id);
    out.push(r.id, ...docs, ...byDoctor(docs));
  } else if (r.role === 'doctor') {
    const docs = r.assigned_admin_id ? byAdmin(r.assigned_admin_id) : [];
    if (!docs.includes(r.id)) docs.push(r.id);
    out.push(...docs, ...byDoctor(docs));
  } else if (r.role === 'assistant') {
    const adminId = r.assigned_doctor_id
      ? (db.prepare('SELECT assigned_admin_id FROM users WHERE id=?').get(r.assigned_doctor_id) || {}).assigned_admin_id
      : null;
    let docs;
    if (adminId) {
      docs = byAdmin(adminId);
      if (!docs.includes(r.assigned_doctor_id)) docs.push(r.assigned_doctor_id);
    } else if (r.assigned_doctor_id) {
      docs = [r.assigned_doctor_id];
    } else {
      docs = [];
    }
    out.push(r.id, ...docs, ...byDoctor(docs));
  } else {
    out.push(r.id);
  }
  return [...new Set(out)];
}

function canAccessPatient(user, patientId) {
  const ids = orgMemberIds(user);
  if (!ids) return true;
  const ph = ids.map(() => '?').join(',');
  return !!db.prepare('SELECT 1 FROM patients p WHERE p.id=? AND (p.created_by IN (' + ph + ') OR EXISTS (SELECT 1 FROM cases c WHERE c.patient_id=p.id AND c.doctor_id IN (' + ph + ')))').get(patientId, ...ids, ...ids);
}

function canAccessCase(user, caseId) {
  const ids = orgMemberIds(user);
  if (!ids) return true;
  const ph = ids.map(() => '?').join(',');
  return !!db.prepare('SELECT 1 FROM cases WHERE id=? AND doctor_id IN (' + ph + ')').get(caseId, ...ids);
}

// ===== AUTH ROUTES =====
app.post('/api/auth/signup', (req, res) => {
  try {
    const { email, password, full_name, role = 'doctor', phone, doctor_id, hospital_name } = req.body;
    if (!email || !password || !full_name) return res.status(400).json({ error: 'Missing fields' });
    const existing = db.prepare('SELECT id FROM users WHERE email=?').get(email);
    if (existing) return res.status(400).json({ error: 'Email already registered' });
    const id = uuid();
    const hash = bcrypt.hashSync(password, 10);
    // Every self-registered account needs CMO (super_admin) approval.
    // The signup UI never offers super_admin, so this is always 0 here;
    // seeded accounts are inserted with approved=1 directly.
    const approved = role === 'super_admin' ? 1 : 0;
    db.prepare('INSERT INTO users (id,email,password_hash,full_name,role,approved,phone,doctor_id,hospital_name) VALUES (?,?,?,?,?,?,?,?,?)').run(id, email, hash, full_name, role, approved, phone || null, doctor_id || null, hospital_name || null);
    const token = jwt.sign({ userId: id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id, email, full_name, role, approved } });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE email=?').get(email);
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    if (!bcrypt.compareSync(password, user.password_hash)) return res.status(400).json({ error: 'Invalid credentials' });
    if (!user.approved) return res.status(403).json({ error: 'Account pending approval', pending: true });
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role, approved: user.approved, assigned_admin_id: user.assigned_admin_id, assigned_doctor_id: user.assigned_doctor_id, phone: user.phone, doctor_id: user.doctor_id, hospital_name: user.hospital_name } });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/auth/me', auth, (req, res) => {
  res.json({ user: req.user });
});

// ===== USERS ROUTES =====
app.get('/api/users', auth, (req, res) => {
  const cols = 'id,email,full_name,role,approved,assigned_admin_id,assigned_doctor_id,phone,doctor_id,hospital_name,created_at';
  let users;
  const r = req.user;
  if (r.role === 'super_admin') {
    users = db.prepare('SELECT ' + cols + ' FROM users ORDER BY created_at DESC').all();
  } else {
    const ids = orgMemberIds(r);
    const ph = ids.map(() => '?').join(',');
    // Non-super users additionally need contactable staff (CMO, hospitals,
    // and for doctors/assistants their peers) for the request-to-join UI.
    let extra = " OR role='super_admin'";
    if (r.role === 'doctor') extra += " OR role='hospital'";
    if (r.role === 'assistant') extra += " OR role='hospital' OR role='doctor'";
    users = db.prepare('SELECT ' + cols + ' FROM users WHERE id IN (' + ph + ')' + extra + ' ORDER BY created_at DESC').all(...ids);
  }
  res.json({ users });
});

app.put('/api/users/:id/assign', auth, superAdminOnly, (req, res) => {
  const { assigned_admin_id, assigned_doctor_id } = req.body;
  if (assigned_admin_id !== undefined) {
    db.prepare('UPDATE users SET assigned_admin_id=? WHERE id=?').run(assigned_admin_id || null, req.params.id);
  }
  if (assigned_doctor_id !== undefined) {
    db.prepare('UPDATE users SET assigned_doctor_id=? WHERE id=?').run(assigned_doctor_id || null, req.params.id);
  }
  res.json({ success: true });
});

app.put('/api/users/:id/approve', auth, superAdminOnly, (req, res) => {
  db.prepare('UPDATE users SET approved=1 WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

app.delete('/api/users/:id', auth, superAdminOnly, (req, res) => {
  try {
    const existing = db.prepare('SELECT id FROM users WHERE id=?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'User not found' });
    db.prepare('DELETE FROM users WHERE id=?').run(req.params.id);
    res.json({ success: true });
  } catch(e) {
    // e.g. foreign-key references from cases/assignment_requests
    res.status(400).json({ error: 'Cannot delete user: ' + e.message });
  }
});

// ===== PATIENTS ROUTES =====
app.get('/api/patients', auth, (req, res) => {
  const ids = orgMemberIds(req.user);
  let patients;
  if (!ids) {
    patients = db.prepare('SELECT * FROM patients ORDER BY created_at DESC').all();
  } else {
    const ph = ids.map(() => '?').join(',');
    patients = db.prepare('SELECT * FROM patients WHERE created_by IN (' + ph + ') OR EXISTS (SELECT 1 FROM cases c WHERE c.patient_id = patients.id AND c.doctor_id IN (' + ph + ')) ORDER BY created_at DESC').all(...ids, ...ids);
  }
  res.json({ patients });
});

app.post('/api/patients', auth, (req, res) => {
  const { name, age, gender, contact, abha_id } = req.body;
  if (!name || !age || !gender || !contact) return res.status(400).json({ error: 'Missing required fields' });
  const id = uuid();
  db.prepare('INSERT INTO patients (id,name,age,gender,contact,abha_id,created_by) VALUES (?,?,?,?,?,?,?)').run(id, name, age, gender, contact, abha_id || null, req.user.id);
  const patient = db.prepare('SELECT * FROM patients WHERE id=?').get(id);
  res.json({ patient });
});

app.get('/api/patients/:id', auth, (req, res) => {
  const patient = db.prepare('SELECT * FROM patients WHERE id=?').get(req.params.id);
  if (!patient) return res.status(404).json({ error: 'Patient not found' });
  if (!canAccessPatient(req.user, patient.id)) return res.status(403).json({ error: 'Forbidden' });
  res.json({ patient });
});

// ===== CASES ROUTES =====
app.get('/api/cases', auth, (req, res) => {
  const ids = orgMemberIds(req.user);
  const sel = `
    SELECT c.*, p.name as patient_name, u.full_name as doctor_name,
           au.full_name as admin_name
    FROM cases c
    LEFT JOIN patients p ON c.patient_id = p.id
    LEFT JOIN users u ON c.doctor_id = u.id
    LEFT JOIN users au ON u.assigned_admin_id = au.id
  `;
  let cases;
  if (!ids) {
    cases = db.prepare(sel + ' ORDER BY c.created_at DESC').all();
  } else {
    const ph = ids.map(() => '?').join(',');
    cases = db.prepare(sel + ' WHERE c.doctor_id IN (' + ph + ') ORDER BY c.created_at DESC').all(...ids);
  }
  res.json({ cases });
});

app.get('/api/cases/:id', auth, (req, res) => {
  const c = db.prepare(`
    SELECT c.*, p.name as patient_name, p.age as patient_age, p.gender as patient_gender,
           p.contact as patient_contact, p.abha_id as patient_abha,
           u.full_name as doctor_name, au.full_name as admin_name
    FROM cases c
    LEFT JOIN patients p ON c.patient_id = p.id
    LEFT JOIN users u ON c.doctor_id = u.id
    LEFT JOIN users au ON u.assigned_admin_id = au.id
    WHERE c.id=?
  `).get(req.params.id);
  if (!c) return res.status(404).json({ error: 'Case not found' });
  if (!canAccessCase(req.user, c.id)) return res.status(403).json({ error: 'Forbidden' });
  res.json({ case: c });
});

app.get('/api/patients/:id/cases', auth, (req, res) => {
  if (!canAccessPatient(req.user, req.params.id)) return res.status(403).json({ error: 'Forbidden' });
  const ids = orgMemberIds(req.user);
  let cases;
  if (!ids) {
    cases = db.prepare('SELECT c.*, u.full_name as doctor_name FROM cases c LEFT JOIN users u ON c.doctor_id = u.id WHERE c.patient_id=? ORDER BY c.created_at DESC').all(req.params.id);
  } else {
    const ph = ids.map(() => '?').join(',');
    cases = db.prepare('SELECT c.*, u.full_name as doctor_name FROM cases c LEFT JOIN users u ON c.doctor_id = u.id WHERE c.patient_id=? AND c.doctor_id IN (' + ph + ') ORDER BY c.created_at DESC').all(req.params.id, ...ids);
  }
  res.json({ cases });
});

app.post('/api/cases', auth, (req, res) => {
  const { patient_id, stream, chief_complaints, history_present_illness, past_history,
          family_history, personal_history, vitals, stream_specific_data,
          diagnosis, namaste_code, icd11_tm2_code, treatment_plan, follow_up_of } = req.body;
  const id = uuid();
  db.prepare(`INSERT INTO cases (id,patient_id,doctor_id,stream,chief_complaints,
    history_present_illness,past_history,family_history,personal_history,vitals,
    stream_specific_data,diagnosis,namaste_code,icd11_tm2_code,treatment_plan,follow_up_of)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    id, patient_id, req.user.id, stream, chief_complaints || null,
    history_present_illness || null, past_history || null, family_history || null,
    personal_history ? JSON.stringify(personal_history) : null,
    vitals ? JSON.stringify(vitals) : null,
    stream_specific_data ? JSON.stringify(stream_specific_data) : null,
    diagnosis || null, namaste_code || null, icd11_tm2_code || null,
    treatment_plan || null, follow_up_of || null
  );
  const c = db.prepare('SELECT * FROM cases WHERE id=?').get(id);
  res.json({ case: c });
});

app.get('/api/notifications', auth, (req, res) => {
  const notifications = db.prepare('SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 50').all(req.user.id);
  res.json({ notifications });
});

app.put('/api/notifications/:id/read', auth, (req, res) => {
  db.prepare('UPDATE notifications SET read=1 WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ success: true });
});

app.put('/api/notifications/read-all', auth, (req, res) => {
  db.prepare('UPDATE notifications SET read=1 WHERE user_id=?').run(req.user.id);
  res.json({ success: true });
});

app.get('/api/stats', auth, (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7*86400000).toISOString();
  const patientsToday = db.prepare("SELECT COUNT(*) as c FROM patients WHERE date(created_at)=?").get(today).c;
  const casesWeek = db.prepare("SELECT COUNT(*) as c FROM cases WHERE created_at>=?").get(weekAgo).c;
  const totalPatients = db.prepare("SELECT COUNT(*) as c FROM patients").get().c;
  const casesPerStream = db.prepare("SELECT stream, COUNT(*) as count FROM cases GROUP BY stream").all();
  const commonDiagnoses = db.prepare("SELECT diagnosis, COUNT(*) as count FROM cases WHERE diagnosis IS NOT NULL GROUP BY diagnosis ORDER BY count DESC LIMIT 10").all();
  res.json({ patientsToday, casesWeek, totalPatients, casesPerStream, commonDiagnoses });
});



app.get('/api/assignment_requests', auth, (req, res) => {
  const requests = db.prepare("SELECT ar.*, fu.full_name as from_user_name, tu.full_name as to_user_name FROM assignment_requests ar LEFT JOIN users fu ON ar.from_user_id = fu.id LEFT JOIN users tu ON ar.to_user_id = tu.id WHERE ar.from_user_id = ? OR ar.to_user_id = ? ORDER BY ar.created_at DESC").all(req.user.id, req.user.id);
  res.json({ requests });
});

app.post('/api/assignment_requests', auth, (req, res) => {
  const { to_user_id, request_type, reason } = req.body;
  const id = uuid();
  db.prepare('INSERT INTO assignment_requests (id,from_user_id,to_user_id,request_type,reason) VALUES (?,?,?,?,?)').run(id, req.user.id, to_user_id, request_type, reason || null);
  const notifId = uuid();
  db.prepare('INSERT INTO notifications (id,user_id,title,message,type,link) VALUES (?,?,?,?,?,?)').run(notifId, to_user_id, 'New Assignment Request', req.user.full_name + ' wants to join you', 'info', '/users');
  res.json({ request: db.prepare('SELECT * FROM assignment_requests WHERE id=?').get(id) });
});

app.put('/api/assignment_requests/:id', auth, (req, res) => {
  const { status } = req.body;
  const ar = db.prepare('SELECT * FROM assignment_requests WHERE id=?').get(req.params.id);
  if (!ar) return res.status(404).json({ error: 'Request not found' });
  db.prepare('UPDATE assignment_requests SET status=?, resolved_at=datetime("now"), resolved_by=? WHERE id=?').run(status, req.user.id, req.params.id);
  if (status === 'approved') {
    if (ar.request_type === 'doctor_to_admin') {
      db.prepare('UPDATE users SET assigned_admin_id=? WHERE id=?').run(ar.to_user_id, ar.from_user_id);
    } else {
      db.prepare('UPDATE users SET assigned_doctor_id=? WHERE id=?').run(ar.to_user_id, ar.from_user_id);
    }
  }
  const notifId = uuid();
  db.prepare('INSERT INTO notifications (id,user_id,title,message,type,link) VALUES (?,?,?,?,?,?)').run(notifId, ar.from_user_id, 'Request ' + status, 'Your assignment request has been ' + status, status === 'approved' ? 'success' : 'error', '/users');
  res.json({ success: true });
});


// Update case status (ongoing/closed) - doctors and assistants only
app.put('/api/cases/:id', auth, (req, res) => {
  const updates = req.body;
  if (updates.status && ['ongoing', 'closed'].includes(updates.status)) {
    if (req.user.role !== 'doctor' && req.user.role !== 'assistant' && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only doctors and assistants can update case status' });
    }
    if (!canAccessCase(req.user, req.params.id)) return res.status(403).json({ error: 'Forbidden' });
    db.prepare('UPDATE cases SET status=? WHERE id=?').run(updates.status, req.params.id);
  }
  res.json({ success: true });
});

app.patch('/api/cases/:id/status', auth, (req, res) => {
  const { status } = req.body;
  if (!['ongoing', 'closed'].includes(status)) {
    return res.status(400).json({ error: 'Status must be ongoing or closed' });
  }
  const caseRec = db.prepare('SELECT * FROM cases WHERE id=?').get(req.params.id);
  if (!caseRec) return res.status(404).json({ error: 'Case not found' });
  if (req.user.role !== 'doctor' && req.user.role !== 'assistant' && req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Only doctors and assistants can update case status' });
  }
  db.prepare('UPDATE cases SET status=? WHERE id=?').run(status, req.params.id);
  res.json({ success: true, status });
});

// Get patient history with all previous cases - for PDF export
app.get('/api/patients/:id/history', auth, (req, res) => {
  const patient = db.prepare('SELECT * FROM patients WHERE id=?').get(req.params.id);
  if (!patient) return res.status(404).json({ error: 'Patient not found' });
  if (!canAccessPatient(req.user, patient.id)) return res.status(403).json({ error: 'Forbidden' });
  const ids = orgMemberIds(req.user);
  let cases;
  if (!ids) {
    cases = db.prepare("SELECT c.*, u.full_name as doctor_name, au.full_name as admin_name FROM cases c LEFT JOIN users u ON c.doctor_id = u.id LEFT JOIN users au ON u.assigned_admin_id = au.id WHERE c.patient_id = ? ORDER BY c.created_at DESC").all(req.params.id);
  } else {
    const ph = ids.map(() => '?').join(',');
    cases = db.prepare("SELECT c.*, u.full_name as doctor_name, au.full_name as admin_name FROM cases c LEFT JOIN users u ON c.doctor_id = u.id LEFT JOIN users au ON u.assigned_admin_id = au.id WHERE c.patient_id = ? AND c.doctor_id IN (" + ph + ") ORDER BY c.created_at DESC").all(req.params.id, ...ids);
  }
  res.json({ patient, cases });
});

// Serve built frontend (production) — falls back to index.html for SPA routes
const distDir = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log('Server running on http://localhost:' + PORT);
});
