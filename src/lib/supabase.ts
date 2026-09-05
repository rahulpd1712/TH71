const API_BASE = import.meta.env.VITE_API_URL || '';

function getToken(): string | null {
  return localStorage.getItem('ayush_token');
}

function setToken(token: string | null) {
  if (token) localStorage.setItem('ayush_token', token);
  else localStorage.removeItem('ayush_token');
}

async function apiFetch(path: string, opts: any = {}) {
  const token = getToken();
  const headers: any = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(API_BASE + path, { ...opts, headers: { ...headers, ...opts.headers } });
  const data = await res.json();
  if (!res.ok) return { data: null, error: { message: data.error || 'Request failed' } };
  return { data, error: null };
}

class QueryBuilder implements PromiseLike<{ data: any; error: any }> {
  private table: string;
  private op: string = 'select';
  private selectFields = '*';
  private insertData: any = null;
  private updateData: any = null;
  private filters: any[] = [];
  private orderField = '';
  private orderAsc = true;
  private singleMode = false;
  private notFilters: any[] = [];
  private inFilters: any[] = [];
  private limitCount = 0;
  private gteFilters: any[] = [];
  private countMode = false;
  private ilikeFilters: any[] = [];

  constructor(table: string) { this.table = table; }

  select(fields = '*', opts?: any) { this.op = 'select'; this.selectFields = fields; if (opts?.count === 'exact') this.countMode = true; return this; }
  insert(data: any) { this.op = 'insert'; this.insertData = data; return this; }
  update(data: any) { this.op = 'update'; this.updateData = data; return this; }
  delete() { this.op = 'delete'; return this; }
  eq(col: string, val: any) { this.filters.push({ col, op: '=', val }); return this; }
  not(col: string, op: string, val: any) { this.notFilters.push({ col, op, val }); return this; }
  in(col: string, vals: any[]) { this.inFilters.push({ col, vals }); return this; }
  limit(n: number) { this.limitCount = n; return this; }
  gte(col: string, val: any) { this.gteFilters.push({ col, val }); return this; }
  ilike(col: string, pattern: string) { this.ilikeFilters.push({ col, pattern }); return this; }
  order(field: string, opts?: any) { this.orderField = field; this.orderAsc = opts?.ascending !== false; return this; }
  single() { this.singleMode = true; return this; }

  then<R1 = { data: any; error: any }, R2 = never>(
    onfulfilled?: ((v: { data: any; error: any; count?: number }) => R1 | PromiseLike<R1>) | null,
    onrejected?: ((r: any) => R2 | PromiseLike<R2>) | null
  ): Promise<any> {
    return this.execute().then(onfulfilled, onrejected);
  }

  private async execute() {
    if (this.op === 'select') return this.doSelect();
    if (this.op === 'insert') return this.doInsert();
    if (this.op === 'update') return this.doUpdate();
    if (this.op === 'delete') return this.doDelete();
    return { data: null, error: { message: 'Unknown op' } };
  }

  private async doSelect() {
    const { data, error } = await apiFetch('/api/' + this.table);
    if (error) return { data: null, error };
    let rows = data[this.table] || data.users || data.patients || data.cases || data.requests || data.notifications || Object.values(data)[0] || data;
    if (!Array.isArray(rows)) rows = [];
    rows = rows.map((r: any) => ({ ...r, approved: !!r.approved, read: r.read !== undefined ? !!r.read : r.read }));
    for (const f of this.filters) rows = rows.filter((r: any) => String(r[f.col]) === String(f.val));
    for (const nf of this.notFilters) {
      if (nf.op === 'is' && nf.val === null) rows = rows.filter((r: any) => r[nf.col] !== null && r[nf.col] !== undefined);
    }
    for (const inf of this.inFilters) rows = rows.filter((r: any) => inf.vals.map(String).includes(String(r[inf.col])));
    for (const gf of this.gteFilters) rows = rows.filter((r: any) => r[gf.col] >= gf.val);
    for (const ilf of this.ilikeFilters) {
      const pat = new RegExp(ilf.pattern.replace(/%/g, '.*'), 'i');
      rows = rows.filter((r: any) => pat.test(r[ilf.col] || ''));
    }
    if (this.limitCount > 0) rows = rows.slice(0, this.limitCount);
    if (this.orderField) {
      const f = this.orderField, asc = this.orderAsc;
      rows.sort((a: any, b: any) => asc ? String(a[f]||'').localeCompare(String(b[f]||'')) : String(b[f]||'').localeCompare(String(a[f]||'')));
    }
    if (this.countMode) return { data: null, count: rows.length, error: null };
    if (this.singleMode) return { data: rows[0] || null, error: null };
    return { data: rows, error: null };
  }

  private async doInsert() {
    const items = Array.isArray(this.insertData) ? this.insertData : [this.insertData];
    const results = [];
    for (const item of items) {
      const { data, error } = await apiFetch('/api/' + this.table, { method: 'POST', body: JSON.stringify(item) });
      if (error) return { data: null, error };
      results.push(data);
    }
    return { data: results.length === 1 ? results[0] : results, error: null };
  }

  private async doUpdate() {
    const f = this.filters.find(f => f.op === '=');
    if (!f) return { data: null, error: { message: 'No eq filter' } };
    const body = this.updateData;
    let endpoint = '/api/' + this.table + '/' + f.val;
    if (this.table === 'users') {
      if (body && ('assigned_admin_id' in body || 'assigned_doctor_id' in body)) {
        endpoint = '/api/users/' + f.val + '/assign';
      } else if (body && 'approved' in body) {
        endpoint = '/api/users/' + f.val + '/approve';
      }
    } else if (this.table === 'notifications') {
      const hasId = this.filters.some(x => x.op === '=' && x.col === 'id');
      endpoint = hasId ? '/api/notifications/' + f.val + '/read' : '/api/notifications/read-all';
    }
    const { data, error } = await apiFetch(endpoint, { method: 'PUT', body: JSON.stringify(body) });
    if (error) return { data: null, error };
    return { data, error: null };
  }

  private async doDelete() {
    const f = this.filters.find(f => f.op === '=');
    if (!f) return { data: null, error: { message: 'No eq filter' } };
    const { data, error } = await apiFetch('/api/' + this.table + '/' + f.val, { method: 'DELETE' });
    if (error) return { data: null, error };
    return { data, error: null };
  }
}

let authListeners: Array<(event: string, session: any) => void> = [];

const auth = {
  async getSession() {
    const token = getToken();
    if (!token) return { data: { session: null }, error: null };
    const { data, error } = await apiFetch('/api/auth/me');
    if (error) return { data: { session: null }, error };
    return { data: { session: { user: data.user, access_token: token } }, error: null };
  },
  async signInWithPassword({ email, password }: { email: string; password: string }) {
    const { data, error } = await apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    if (error) return { error };
    setToken(data.token);
    authListeners.forEach(fn => fn('SIGNED_IN', { user: data.user }));
    return { data: { user: data.user }, error: null };
  },
  async signUp({ email, password, options }: any) {
    const m = options?.data || {};
    const { data, error } = await apiFetch('/api/auth/signup', {
      method: 'POST', body: JSON.stringify({ email, password, full_name: m.full_name || email, role: m.role || 'doctor', phone: m.phone || null, doctor_id: m.doctor_id || null, hospital_name: m.hospital_name || null })
    });
    if (error) return { error };
    setToken(data.token);
    authListeners.forEach(fn => fn('SIGNED_IN', { user: data.user }));
    return { data: { user: data.user }, error: null };
  },
  async signOut() { setToken(null); authListeners.forEach(fn => fn('SIGNED_OUT', null)); return { error: null }; },
  onAuthStateChange(callback: (event: string, session: any) => void) {
    authListeners.push(callback);
    return { data: { subscription: { unsubscribe: () => { authListeners = authListeners.filter(fn => fn !== callback); } } } };
  }
};

export const supabase = { auth, from(table: string) { return new QueryBuilder(table); } };

export type UserRole = 'doctor' | 'assistant' | 'admin' | 'hospital' | 'super_admin'

export interface UserProfile {
  id: string; email: string; role: UserRole; full_name: string | null; approved: boolean;
  requested_at: string | null; created_at: string;
  assigned_admin_id: string | null; assigned_doctor_id: string | null;
  phone: string | null; doctor_id: string | null; hospital_name: string | null;
}
