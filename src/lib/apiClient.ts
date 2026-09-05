const API_BASE = import.meta.env.VITE_API_URL || ''
const TOKEN_KEY = 'ayush_token'

type ApiError = { message: string }
type ApiResult<T> = { data: T | null; error: ApiError | null }
type QueryResult = { data: any; error: ApiError | null; count?: number }
type Filter = { col: string; op: string; val: unknown }

interface RequestOptions extends Omit<RequestInit, 'body' | 'headers'> {
  body?: unknown
  headers?: HeadersInit
}

export type UserRole = 'doctor' | 'assistant' | 'admin' | 'hospital' | 'super_admin'

export interface UserProfile {
  id: string
  email: string
  role: UserRole
  full_name: string | null
  approved: boolean
  requested_at: string | null
  created_at: string
  assigned_admin_id: string | null
  assigned_doctor_id: string | null
  phone: string | null
  doctor_id: string | null
  hospital_name: string | null
}

export interface LocalUser {
  id: string
  email?: string
  role?: string
  full_name?: string
}

export interface LocalSession {
  user: LocalUser
  access_token?: string
}

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

async function apiFetch<T = unknown>(path: string, options: RequestOptions = {}): Promise<ApiResult<T>> {
  const token = getToken()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }

  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...headers, ...options.headers },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    return { data: null, error: { message: data.error || 'Request failed' } }
  }

  return { data, error: null }
}

class QueryBuilder implements PromiseLike<QueryResult> {
  private readonly table: string
  private op: 'select' | 'insert' | 'update' | 'delete' = 'select'
  private insertData: unknown = null
  private updateData: unknown = null
  private filters: Filter[] = []
  private notFilters: Filter[] = []
  private inFilters: Array<{ col: string; vals: unknown[] }> = []
  private gteFilters: Array<{ col: string; val: unknown }> = []
  private ilikeFilters: Array<{ col: string; pattern: string }> = []
  private orderField = ''
  private orderAsc = true
  private singleMode = false
  private limitCount = 0
  private countMode = false

  constructor(table: string) {
    this.table = table
  }

  select(_fields = '*', opts?: { count?: 'exact'; head?: boolean }) {
    this.op = 'select'
    this.countMode = opts?.count === 'exact'
    return this
  }

  insert(data: unknown) {
    this.op = 'insert'
    this.insertData = data
    return this
  }

  update(data: unknown) {
    this.op = 'update'
    this.updateData = data
    return this
  }

  delete() {
    this.op = 'delete'
    return this
  }

  eq(col: string, val: unknown) {
    this.filters.push({ col, op: '=', val })
    return this
  }

  not(col: string, op: string, val: unknown) {
    this.notFilters.push({ col, op, val })
    return this
  }

  in(col: string, vals: unknown[]) {
    this.inFilters.push({ col, vals })
    return this
  }

  limit(n: number) {
    this.limitCount = n
    return this
  }

  gte(col: string, val: unknown) {
    this.gteFilters.push({ col, val })
    return this
  }

  ilike(col: string, pattern: string) {
    this.ilikeFilters.push({ col, pattern })
    return this
  }

  order(field: string, opts?: { ascending?: boolean }) {
    this.orderField = field
    this.orderAsc = opts?.ascending !== false
    return this
  }

  single() {
    this.singleMode = true
    return this
  }

  // eslint-disable-next-line unicorn/no-thenable
  then<TResult1 = QueryResult, TResult2 = never>(
    onfulfilled?: ((value: QueryResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected)
  }

  private async execute(): Promise<QueryResult> {
    if (this.op === 'select') return this.doSelect()
    if (this.op === 'insert') return this.doInsert()
    if (this.op === 'update') return this.doUpdate()
    return this.doDelete()
  }

  private async doSelect(): Promise<QueryResult> {
    const { data, error } = await apiFetch<Record<string, unknown>>(`/api/${this.table}`)
    if (error) return { data: null, error }

    let rows = getRows(data, this.table)
    rows = this.applyFilters(rows)

    if (this.orderField) {
      rows.sort((a, b) => compareValues(a[this.orderField], b[this.orderField], this.orderAsc))
    }

    if (this.limitCount > 0) rows = rows.slice(0, this.limitCount)
    if (this.countMode) return { data: null, count: rows.length, error: null }
    if (this.singleMode) return { data: rows[0] || null, error: null }

    return { data: rows, error: null }
  }

  private applyFilters(rows: Array<Record<string, unknown>>): Array<Record<string, unknown>> {
    let filtered = rows.map(normalizeRow)

    for (const filter of this.filters) {
      filtered = filtered.filter(row => String(row[filter.col]) === String(filter.val))
    }

    for (const filter of this.notFilters) {
      if (filter.op === 'is' && filter.val === null) {
        filtered = filtered.filter(row => row[filter.col] !== null && row[filter.col] !== undefined)
      }
    }

    for (const filter of this.inFilters) {
      const values = filter.vals.map(String)
      filtered = filtered.filter(row => values.includes(String(row[filter.col])))
    }

    for (const filter of this.gteFilters) {
      filtered = filtered.filter(row => String(row[filter.col] ?? '') >= String(filter.val))
    }

    for (const filter of this.ilikeFilters) {
      const pattern = new RegExp(filter.pattern.replace(/%/g, '.*'), 'i')
      filtered = filtered.filter(row => pattern.test(String(row[filter.col] ?? '')))
    }

    return filtered
  }

  private async doInsert(): Promise<QueryResult> {
    const items = Array.isArray(this.insertData) ? this.insertData : [this.insertData]
    const results: unknown[] = []

    for (const item of items) {
      const { data, error } = await apiFetch(`/api/${this.table}`, { method: 'POST', body: item })
      if (error) return { data: null, error }
      results.push(data)
    }

    return { data: results.length === 1 ? results[0] : results, error: null }
  }

  private async doUpdate(): Promise<QueryResult> {
    const filter = this.filters.find(item => item.op === '=')
    if (!filter) return { data: null, error: { message: 'No eq filter provided for update' } }

    const endpoint = this.table === 'users'
      ? `/api/users/${filter.val}/assign`
      : `/api/${this.table}/${filter.val}`

    return apiFetch(endpoint, { method: 'PUT', body: this.updateData })
  }

  private async doDelete(): Promise<QueryResult> {
    const filter = this.filters.find(item => item.op === '=')
    if (!filter) return { data: null, error: { message: 'No eq filter provided for delete' } }

    return apiFetch(`/api/${this.table}/${filter.val}`, { method: 'DELETE' })
  }
}

function getRows(data: Record<string, unknown> | null, table: string): Array<Record<string, unknown>> {
  if (!data) return []

  const rows = data[table] ?? data.users ?? data.patients ?? data.cases ?? data.requests ?? data.notifications
  return Array.isArray(rows) ? rows as Array<Record<string, unknown>> : []
}

function normalizeRow(row: Record<string, unknown>): Record<string, unknown> {
  return {
    ...row,
    approved: row.approved === undefined ? row.approved : Boolean(row.approved),
    read: row.read === undefined ? row.read : Boolean(row.read),
  }
}

function compareValues(a: unknown, b: unknown, ascending: boolean) {
  const left = String(a ?? '')
  const right = String(b ?? '')
  return ascending ? left.localeCompare(right) : right.localeCompare(left)
}

type AuthListener = (event: 'SIGNED_IN' | 'SIGNED_OUT', session: LocalSession | null) => void
const authListeners: AuthListener[] = []

const auth = {
  async getSession(): Promise<{ data: { session: LocalSession | null }; error: ApiError | null }> {
    const token = getToken()
    if (!token) return { data: { session: null }, error: null }

    const { data, error } = await apiFetch<{ user: LocalUser }>('/api/auth/me')
    if (error || !data?.user) return { data: { session: null }, error }

    return { data: { session: { user: data.user, access_token: token } }, error: null }
  },

  async signInWithPassword(credentials: { email: string; password: string }) {
    const { data, error } = await apiFetch<{ token: string; user: LocalUser }>('/api/auth/login', {
      method: 'POST',
      body: credentials,
    })

    if (error || !data) return { error }

    setToken(data.token)
    authListeners.forEach(listener => listener('SIGNED_IN', { user: data.user, access_token: data.token }))

    return { data: { user: data.user }, error: null }
  },

  async signUp({ email, password, options }: {
    email: string
    password: string
    options?: { data?: Partial<UserProfile> }
  }) {
    const metadata = options?.data || {}
    const { data, error } = await apiFetch<{ token: string; user: LocalUser }>('/api/auth/signup', {
      method: 'POST',
      body: {
        email,
        password,
        full_name: metadata.full_name || email,
        role: metadata.role || 'doctor',
        phone: metadata.phone || null,
        doctor_id: metadata.doctor_id || null,
        hospital_name: metadata.hospital_name || null,
      },
    })

    if (error || !data) return { error }

    setToken(data.token)
    authListeners.forEach(listener => listener('SIGNED_IN', { user: data.user, access_token: data.token }))

    return { data: { user: data.user }, error: null }
  },

  async signOut() {
    setToken(null)
    authListeners.forEach(listener => listener('SIGNED_OUT', null))
    return { error: null }
  },

  onAuthStateChange(callback: AuthListener) {
    authListeners.push(callback)

    return {
      data: {
        subscription: {
          unsubscribe: () => {
            const index = authListeners.indexOf(callback)
            if (index >= 0) authListeners.splice(index, 1)
          },
        },
      },
    }
  },
}

export const apiClient = {
  auth,
  from(table: string) {
    return new QueryBuilder(table)
  },
}
