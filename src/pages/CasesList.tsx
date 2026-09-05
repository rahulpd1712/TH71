import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { FileText, Search, Eye, Filter, X, CheckCircle, Circle } from "lucide-react"

interface CaseRow {
  id: string
  patient_id: string
  doctor_id: string
  stream: string
  chief_complaints: string | null
  diagnosis: string | null
  status: string | null
  created_at: string
  patient_name?: string
  patient_age?: number | null
  patient_gender?: string | null
  patient_contact?: string | null
  patient_abha?: string | null
  doctor_name?: string
  admin_name?: string
}

interface UserRow { id: string; full_name: string | null; role: string; assigned_admin_id: string | null }

export default function CasesList() {
  const [cases, setCases] = useState<CaseRow[]>([])
  const [allCases, setAllCases] = useState<CaseRow[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [filterDoctor, setFilterDoctor] = useState('')
  const [filterStream, setFilterStream] = useState('')
  const [filterAdmin, setFilterAdmin] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [sortByAbha, setSortByAbha] = useState(false)
  const [doctors, setDoctors] = useState<UserRow[]>([])
  const [admins, setAdmins] = useState<UserRow[]>([])
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'super_admin' || profile?.role === 'hospital' || profile?.role === 'admin'

  useEffect(() => { loadCases(); loadUsers() }, [])

  async function loadUsers() {
    const { data: u } = await supabase.from('users').select('id, full_name, role, assigned_admin_id')
    if (u) {
      setDoctors(u.filter((x: UserRow) => x.role === 'doctor'))
      setAdmins(u.filter((x: UserRow) => x.role === 'hospital' || x.role === 'admin'))
    }
  }

  async function loadCases() {
    setLoading(true)
    const { data } = await supabase.from('cases').select('*').order('created_at', { ascending: false }).limit(200)
    const casesList = (data || []) as any[]

    // Fetch patient demographics for the case rows
    const patientIds = [...new Set(casesList.map((c: any) => c.patient_id).filter(Boolean))]
    let patientMap: Record<string, { name: string; age: number | null; gender: string | null; contact: string | null; abha_id: string | null }> = {}
    if (patientIds.length > 0) {
      const { data: pts } = await supabase.from('patients').select('id, name, age, gender, contact, abha_id')
      if (pts) pts.forEach((p: any) => { patientMap[p.id] = { name: p.name, age: p.age ?? null, gender: p.gender ?? null, contact: p.contact ?? null, abha_id: p.abha_id ?? null } })
    }

    // Fetch doctor names
    const doctorIds = [...new Set(casesList.map((c: any) => c.doctor_id).filter(Boolean))]
    let doctorMap: Record<string, string> = {}
    if (doctorIds.length > 0) {
      const { data: docUsers } = await supabase.from('users').select('id, full_name').in('id', doctorIds)
      if (docUsers) docUsers.forEach((d: any) => { doctorMap[d.id] = d.full_name || 'Unknown' })
    }

    // Build admin mapping
    const { data: allUsers } = await supabase.from('users').select('id, full_name, role, assigned_admin_id')
    let adminMap: Record<string, string> = {}
    let doctorAdminMap: Record<string, string> = {}
    if (allUsers) {
      allUsers.filter((u: any) => u.role === 'hospital' || u.role === 'admin').forEach((a: any) => { adminMap[a.id] = a.full_name || 'Unknown' })
      allUsers.filter((u: any) => u.role === 'doctor' && u.assigned_admin_id).forEach((d: any) => {
        doctorAdminMap[d.id] = adminMap[d.assigned_admin_id] || 'Unassigned'
      })
    }

    const enriched = casesList.map((c: any) => ({
      ...c,
      patient_name: patientMap[c.patient_id]?.name || 'Unknown',
      patient_age: patientMap[c.patient_id]?.age ?? null,
      patient_gender: patientMap[c.patient_id]?.gender ?? null,
      patient_contact: patientMap[c.patient_id]?.contact ?? null,
      patient_abha: patientMap[c.patient_id]?.abha_id || null,
      doctor_name: doctorMap[c.doctor_id] || 'Unknown',
      admin_name: doctorAdminMap[c.doctor_id] || 'Unassigned'
    }))
    setAllCases(enriched)
    setCases(enriched)
    setLoading(false)
  }

  useEffect(() => {
    let filtered = allCases
    if (search) {
      const s = search.toLowerCase()
      filtered = filtered.filter(c => {
        if (isAdmin) return c.id.toLowerCase().includes(s) || c.stream.toLowerCase().includes(s) || c.doctor_name?.toLowerCase().includes(s)
        return c.diagnosis?.toLowerCase().includes(s) || c.patient_name?.toLowerCase().includes(s)
      })
    }
    if (filterDoctor) filtered = filtered.filter(c => c.doctor_id === filterDoctor)
    if (filterStream) filtered = filtered.filter(c => c.stream === filterStream)
    if (filterAdmin) filtered = filtered.filter(c => c.admin_name === admins.find(a => a.id === filterAdmin)?.full_name)
    if (filterStatus) filtered = filtered.filter(c => (c.status || 'ongoing') === filterStatus)
    if (sortByAbha) filtered = [...filtered].sort((a, b) => (a.patient_abha || '').localeCompare(b.patient_abha || ''))
    setCases(filtered)
  }, [search, filterDoctor, filterStream, filterAdmin, filterStatus, sortByAbha, allCases])

  function clearFilters() {
    setSearch(''); setFilterDoctor(''); setFilterStream(''); setFilterAdmin(''); setFilterStatus(''); setSortByAbha(false)
  }

  const hasFilters = filterDoctor || filterStream || filterAdmin || filterStatus || search || sortByAbha

  async function toggleStatus(caseId: string, currentStatus: string) {
    const newStatus = currentStatus === 'closed' ? 'ongoing' : 'closed'
    await supabase.from('cases').update({ status: newStatus }).eq('id', caseId)
    setAllCases(prev => prev.map(c => c.id === caseId ? { ...c, status: newStatus } : c))
    setCases(prev => prev.map(c => c.id === caseId ? { ...c, status: newStatus } : c))
  }

  const streamColors: Record<string, string> = {
    ayurveda: 'bg-emerald-100 text-emerald-700',
    homeopathy: 'bg-blue-100 text-blue-700',
    unani: 'bg-orange-100 text-orange-700',
    siddha: 'bg-rose-100 text-rose-700',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="bg-purple-100 p-3 rounded-xl">
          <FileText className="h-6 w-6 text-purple-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t("nav_cases")}</h2>
          <p className="text-sm text-gray-500">{cases.length} cases {hasFilters ? '(filtered)' : 'total'}</p>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder={isAdmin ? "Search by case ID, stream, or doctor..." : t("search_diag_patient")}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <Filter className="h-4 w-4 text-gray-400" />
          <select value={filterStream} onChange={(e) => setFilterStream(e.target.value)} className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 outline-none">
            <option value="">{t("all_streams")}</option>
            <option value="ayurveda">Ayurveda</option>
            <option value="homeopathy">Homeopathy</option>
            <option value="unani">Unani</option>
            <option value="siddha">Siddha</option>
          </select>
          <select value={filterDoctor} onChange={(e) => setFilterDoctor(e.target.value)} className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 outline-none">
            <option value="">{t("all_doctors")}</option>
            {doctors.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
          </select>
          <select value={filterAdmin} onChange={(e) => setFilterAdmin(e.target.value)} className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 outline-none">
            <option value="">{t("all_admins")}</option>
            {admins.map(a => <option key={a.id} value={a.id}>{a.full_name}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 outline-none">
            <option value="">All Status</option>
            <option value="ongoing">Ongoing</option>
            <option value="closed">Closed</option>
          </select>
          <button onClick={() => setSortByAbha(!sortByAbha)} className={`text-sm px-3 py-1.5 rounded-lg border ${sortByAbha ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
            ABHA Sort {sortByAbha ? '↑' : ''}
          </button>
          {hasFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800">
              <X className="h-3 w-3" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Cases Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : cases.length === 0 ? (
          <div className="p-8 text-center text-gray-500">{t("no_cases")}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {!isAdmin && <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">{t("patient_name")}</th>}
                  {!isAdmin && <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">{t("age")}</th>}
                  {!isAdmin && <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">{t("gender")}</th>}
                  {!isAdmin && <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">{t("contact")}</th>}
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Case ID</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">{t("stream")}</th>
                  {!isAdmin && <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">{t("diagnosis")}</th>}
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">{t("doctor")}</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">{t("date")}</th>
                  {!isAdmin && <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cases.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    {!isAdmin && <td className="px-4 py-3 font-medium text-gray-900">{c.patient_name}</td>}
                    {!isAdmin && <td className="px-4 py-3 text-gray-600">{c.patient_age ?? '—'}</td>}
                    {!isAdmin && <td className="px-4 py-3 text-gray-600">{c.patient_gender ?? '—'}</td>}
                    {!isAdmin && <td className="px-4 py-3 text-gray-600">{c.patient_contact ?? '—'}</td>}
                    <td className="px-4 py-3 text-xs text-gray-500 font-mono">{c.id.slice(0, 8)}...</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${streamColors[c.stream] || ''}`}>{c.stream}</span>
                    </td>
                    {!isAdmin && <td className="px-4 py-3 text-gray-600">{c.diagnosis || '—'}</td>}
                    <td className="px-4 py-3 text-sm text-emerald-700">{c.doctor_name}</td>
                    <td className="px-4 py-3">
                      {(profile?.role === 'doctor' || profile?.role === 'assistant') ? (
                        <button onClick={() => toggleStatus(c.id, c.status || 'ongoing')} className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${(c.status || 'ongoing') === 'closed' ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'}`}>
                          {(c.status || 'ongoing') === 'closed' ? <CheckCircle className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
                          {(c.status || 'ongoing') === 'closed' ? 'Closed' : 'Ongoing'}
                        </button>
                      ) : (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${(c.status || 'ongoing') === 'closed' ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'}`}>
                          {(c.status || 'ongoing') === 'closed' ? 'Closed' : 'Ongoing'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-sm">{new Date(c.created_at).toLocaleDateString('en-IN')}</td>
                    {!isAdmin && (
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => navigate(`/cases/${c.id}`)} className="text-emerald-600 hover:text-emerald-700 font-medium text-sm inline-flex items-center gap-1">
                          <Eye className="h-4 w-4" /> View
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
