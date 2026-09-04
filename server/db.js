const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');
const fs = require('fs');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'ayush.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'doctor' CHECK(role IN ('super_admin','admin','hospital',1,'doctor',1,'assistant')),
    approved INTEGER NOT NULL DEFAULT 0,
    assigned_admin_id TEXT REFERENCES users(id),
    assigned_doctor_id TEXT REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now')),
    phone TEXT,
    doctor_id TEXT,
    hospital_name TEXT,
    requested_at TEXT
  );
  CREATE TABLE IF NOT EXISTS patients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    age INTEGER NOT NULL,
    gender TEXT NOT NULL,
    contact TEXT NOT NULL,
    abha_id TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS cases (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL REFERENCES patients(id),
    doctor_id TEXT NOT NULL REFERENCES users(id),
    stream TEXT NOT NULL,
    chief_complaints TEXT,
    history_present_illness TEXT,
    past_history TEXT,
    family_history TEXT,
    personal_history TEXT,
    vitals TEXT,
    stream_specific_data TEXT,
    diagnosis TEXT,
    namaste_code TEXT,
    icd11_tm2_code TEXT,
    treatment_plan TEXT,
    follow_up_of TEXT REFERENCES cases(id),
    status TEXT DEFAULT (char(111,110,103,111,105,110,103)),
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS assignment_requests (
    id TEXT PRIMARY KEY,
    from_user_id TEXT NOT NULL REFERENCES users(id),
    to_user_id TEXT NOT NULL REFERENCES users(id),
    request_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    reason TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    resolved_at TEXT,
    resolved_by TEXT REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info',
    read INTEGER DEFAULT 0,
    link TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

function seedDatabase() {
  if (db.prepare('SELECT COUNT(*) as c FROM users').get().c > 0) return;
  const h = bcrypt.hashSync('admin123', 10);
  const dh = bcrypt.hashSync('doctor123', 10);
  const ah = bcrypt.hashSync('asst123', 10);
  const sh = bcrypt.hashSync('RahulAdmin123!', 10);
  const iu = db.prepare('INSERT INTO users (id,email,password_hash,full_name,role,approved,phone,doctor_id,hospital_name) VALUES (?,?,?,?,?,?,?,?,?)');
  iu.run(uuid(),'rahulpd1712@gmail.com',sh,'Rahul','super_admin',1,'9876500001',null,null);
  const a1=uuid(),a2=uuid(),a3=uuid();
  iu.run(a1,'admin.neha@ayush.com',h,'Neha Verma','hospital',1,'9876500002',null,'Neha City Hospital');
  iu.run(a2,'admin.rajesh@ayush.com',h,'Rajesh Kumar','hospital',1,'9876500003',null,'Rajesh Medical Center');
  iu.run(a3,'admin.meera@ayush.com',h,'Meera Singh','hospital',1,'9876500004',null,'Meera Wellness Hospital');
  const d1=uuid(),d2=uuid(),d3=uuid(),d4=uuid(),d5=uuid();
  iu.run(d1,'dr.priya@ayush.com',dh,'Dr. Priya Sharma','doctor',1,'9876500010','DOC-1001',null);
  iu.run(d2,'dr.amit@ayush.com',dh,'Dr. Amit Gupta','doctor',1,'9876500011','DOC-1002',null);
  iu.run(d3,'dr.swati@ayush.com',dh,'Dr. Swati Reddy','doctor',1,'9876500012','DOC-1003',null);
  iu.run(d4,'dr.arjun@ayush.com',dh,'Dr. Arjun Patel','doctor',1,'9876500013','DOC-1004',null);
  iu.run(d5,'dr.fatima@ayush.com',dh,'Dr. Fatima Khan','doctor',1,'9876500014','DOC-1005',null);
  const s1=uuid(),s2=uuid(),s3=uuid();
  iu.run(s1,'asst.ravi@ayush.com',ah,'Ravi Kumar','assistant',1,'9876500020','AST-1001',null);
  iu.run(s2,'asst.pooja@ayush.com',ah,'Pooja Devi','assistant',1,'9876500021','AST-1002',null);
  iu.run(s3,'asst.vikram@ayush.com',ah,'Vikram Joshi','assistant',1,'9876500022','AST-1003',null);
  db.prepare('UPDATE users SET assigned_admin_id=? WHERE id IN (?,?)').run(a1,d1,d2);
  db.prepare('UPDATE users SET assigned_admin_id=? WHERE id IN (?,?)').run(a2,d3,d4);
  db.prepare('UPDATE users SET assigned_admin_id=? WHERE id=?').run(a3,d5);
  db.prepare('UPDATE users SET assigned_doctor_id=? WHERE id IN (?,?)').run(d1,s1,s2);
  db.prepare('UPDATE users SET assigned_doctor_id=? WHERE id=?').run(d3,s3);
  const ip = db.prepare("INSERT INTO patients (id,name,age,gender,contact,abha_id,created_at) VALUES (?,?,?,?,?,?,datetime('now',?))");
  const pt = [
    [uuid(),'Amit Singh',45,'Male','9876543210','ABHA-1001-2025','-15 days'],
    [uuid(),'Sunita Devi',38,'Female','9876543211','ABHA-1002-2025','-14 days'],
    [uuid(),'Rajesh Patel',52,'Male','9876543212','ABHA-1003-2025','-13 days'],
    [uuid(),'Kavita Sharma',29,'Female','9876543213','ABHA-1004-2025','-12 days'],
    [uuid(),'Mohammed Ali',61,'Male','9876543214','ABHA-1005-2025','-11 days'],
    [uuid(),'Priyanka Joshi',34,'Female','9876543215','ABHA-1006-2025','-10 days'],
    [uuid(),'Vikram Rao',48,'Male','9876543216','ABHA-1007-2025','-9 days'],
    [uuid(),'Lakshmi Iyer',55,'Female','9876543217','ABHA-1008-2025','-8 days'],
    [uuid(),'Dinesh Nair',42,'Male','9876543218','ABHA-1009-2025','-7 days'],
    [uuid(),'Anjali Gupta',31,'Female','9876543219','ABHA-1010-2025','-6 days'],
    [uuid(),'Sanjay Mishra',67,'Male','9876543220','ABHA-1011-2025','-5 days'],
    [uuid(),'Deepa Krishnan',26,'Female','9876543221','ABHA-1012-2025','-4 days'],
  ];
  pt.forEach(p => ip.run(...p));
  const pi = pt.map(p=>p[0]);
  const ic = db.prepare("INSERT INTO cases (id,patient_id,doctor_id,stream,chief_complaints,diagnosis,treatment_plan,created_at) VALUES (?,?,?,?,?,?,?,datetime('now',?))");
  const cs = [
    [uuid(),pi[0],d1,'ayurveda','Chronic knee pain for 6 months','Sandhivata','Punarnavadi kashayam 15ml TID','-12 days'],
    [uuid(),pi[3],d2,'homeopathy','Allergic rhinitis for 2 years','Allergic Rhinitis','Natrum Mur 30C weekly','-11 days'],
    [uuid(),pi[2],d2,'homeopathy','Migraine with aura 5 years','Migraine','Belladonna 30C during attack','-9 days'],
    [uuid(),pi[4],d3,'unani','Chronic eczema 1 year','Eczema','Sharbat-e-Unjabin 20ml BD','-10 days'],
    [uuid(),pi[5],d3,'unani','Chronic bronchitis 3 years','Bronchitis','Joshanda 200ml daily','-8 days'],
    [uuid(),pi[6],d4,'siddha','Lower back pain 4 months','Lumbago','Kalyanaka kashayam 15ml BD','-7 days'],
    [uuid(),pi[7],d4,'siddha','Diabetes Type 2 for 5 years','Prameham','Vijaysar churna 3g BD','-4 days'],
    [uuid(),pi[8],d5,'homeopathy','Chronic urticaria 6 months','Urticaria','Urtica Urens 30C TID','-3 days'],
    [uuid(),pi[1],d1,'ayurveda','Menstrual irregularity 8 months','Yonivyapad','Ashokarishta 15ml BD','-3 days'],
    [uuid(),pi[9],d2,'homeopathy','Chronic insomnia 1 year','Insomnia','Coffea Cruda 30C HS','-2 days'],
    [uuid(),pi[0],d3,'unani','Recurring headache 6 months','Headache','Naushadar 250mg TID','-1 day'],
    [uuid(),pi[10],d4,'siddha','Chronic fatigue 6 months','Fatigue','Araguine 500mg BD','-12 hours'],
    [uuid(),pi[3],d5,'ayurveda','Skin rash itching 2 months','Dermatitis','Mahamanjistadi kashayam 15ml BD','-5 days'],
    [uuid(),pi[11],d1,'ayurveda','Chronic cough 2 months','Cough','Sitopaladi churna 1g TID','-8 days'],
    [uuid(),pi[8],d5,'ayurveda','Joint stiffness hands 3 months','RA','Guggulu Tiktaka kashayam 15ml BD','-4 days'],
    [uuid(),pi[4],d3,'unani','High cholesterol fatty liver','Fatty Liver','Sharbat-e-Bazar 20ml BD','-7 days'],
  ];
  cs.forEach(c => ic.run(...c));
  console.log('Seeded:', db.prepare('SELECT COUNT(*) as c FROM users').get().c, 'users,',
    db.prepare('SELECT COUNT(*) as c FROM patients').get().c, 'patients,',
    db.prepare('SELECT COUNT(*) as c FROM cases').get().c, 'cases');
}

module.exports = { db, uuid, seedDatabase };
