import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from 'react-i18next'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { BarChart3, Users, FileText, TrendingUp, ShieldCheck, CheckCircle, XCircle } from 'lucide-react'

interface StreamCount {
  stream: string
  count: number
}

interface DiagnosisCount {
  diagnosis: string
  count: number
}

interface PendingUser {
  id: string
  full_name: string | null
  role: string
  requested_at: string | null
  approved: boolean
}

interface AssignReq {
  id: string
  from_user_id: string
  to_user_id: string
  request_type: string
  status: string
  reason: string | null
  created_at: string
  from_user_name?: string | null
  to_user_name?: string | null
}

export default function AdminDashboard() {
    const { isSuperAdmin } = useAuth()
  const { t } = useTranslation()
  const [stats, setStats] = useState({ patientsToday: 0, casesThisWeek: 0, totalCases: 0 })
  const [streamData, setStreamData] = useState<StreamCount[]>([])
    const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([])
  const [pendingReqs, setPendingReqs] = useState<AssignReq[]>([])
  const [approving, setApproving] = useState<string | null>(null)
  const [actionError, setActionError] = useState('')

  useEffect(() => { loadStats() }, [])
  useEffect(() => {
    const onFocus = () => loadStats()
    window.addEventListener('focus', onFocus)
    const onChanged = () => loadStats()
    window.addEventListener('ayush-stats-changed', onChanged)
    return () => {
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('ayush-stats-changed', onChanged)
    }
  }, [])

  async function loadStats() {
    const todayStart = new Date()
    todayStart.setUTCHours(0, 0, 0, 0)
    const weekAgo = new Date(Date.now() - 7 * 86400000)

    // Server stores timestamps as SQLite datetime('now') => 'YYYY-MM-DD HH:MM:SS' (UTC)
    const fmt = (d: Date) => d.toISOString().replace('T', ' ').slice(0, 19)

    const { count: patientsToday } = await supabase
      .from('patients').select('*', { count: 'exact', head: true })
      .gte('created_at', fmt(todayStart))

    const { count: casesThisWeek } = await supabase
      .from('cases').select('*', { count: 'exact', head: true })
      .gte('created_at', fmt(weekAgo))

    const { count: totalCases } = await supabase
      .from('cases').select('*', { count: 'exact', head: true })

    setStats({
      patientsToday: patientsToday || 0,
      casesThisWeek: casesThisWeek || 0,
      totalCases: totalCases || 0,
    })

    const { data: allCases } = await supabase.from('cases').select('stream')
    if (allCases) {
      const streamCounts: Record<string, number> = {}
      allCases.forEach((c: any) => { streamCounts[c.stream] = (streamCounts[c.stream] || 0) + 1 })
      setStreamData(Object.entries(streamCounts).map(([stream, count]) => ({
        stream: stream.charAt(0).toUpperCase() + stream.slice(1), count,
      })))
    }

    // Load pending account approvals + pending assignment/transfer requests (super_admin only)
    if (isSuperAdmin) {
      const { data: pending } = await supabase
        .from('users')
        .select('id, full_name, role, requested_at, approved')
        .eq('approved', false)
        .order('requested_at', { ascending: false })
      setPendingUsers(pending || [])
      const { data: reqs } = await supabase
        .from('assignment_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
      setPendingReqs((reqs || []) as AssignReq[])
    }
  }

  async function approveUser(userId: string) {
    setActionError('')
    setApproving(userId)
    const { error } = await supabase.from('users').update({ approved: true }).eq('id', userId)
    setApproving(null)
    if (error) { setActionError('Approve failed: ' + error.message); return }
    setPendingUsers(prev => prev.filter(u => u.id !== userId))
  }

  async function rejectUser(userId: string) {
    setActionError('')
    setApproving(userId)
    const { error } = await supabase.from('users').delete().eq('id', userId)
    setApproving(null)
    if (error) { setActionError('Reject failed: ' + error.message); return }
    setPendingUsers(prev => prev.filter(u => u.id !== userId))
  }

  async function resolveRequest(requestId: string, status: string) {
    setActionError('')
    setApproving(requestId)
    const { error } = await supabase.from('assignment_requests').update({ status }).eq('id', requestId)
    setApproving(null)
    if (error) { setActionError('Request action failed: ' + error.message); return }
    setPendingReqs(prev => prev.filter(r => r.id !== requestId))
    window.dispatchEvent(new Event('ayush-stats-changed'))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="bg-indigo-100 p-3 rounded-xl">
          <BarChart3 className="h-6 w-6 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t("practice_overview")}</h2>
          <p className="text-sm text-gray-500">{t("practice_analytics")}</p>
        </div>
      </div>

      {/* Super Admin Approval Section */}
      {isSuperAdmin && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="h-5 w-5 text-indigo-600" />
            <h3 className="font-semibold text-gray-900">{t("admin_approval_requests")}</h3>
          </div>
          {actionError && (
            <div className="bg-red-50 text-red-700 px-4 py-2.5 rounded-lg text-sm border border-red-200 mb-4">{actionError}</div>
          )}
          {pendingUsers.length === 0 ? (
            <div className="text-center py-6 text-gray-400">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-400" />
              No pending approval requests
            </div>
          ) : (
            <div className="space-y-3">
              {pendingUsers.map(u => (
                <div key={u.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <div>
                    <div className="font-medium text-gray-900">{u.full_name || 'Unknown'}</div>
                    <div className="text-xs text-gray-500">
                      Role: <span className="capitalize">{u.role}</span>
                      {u.requested_at && ` • Requested: ${new Date(u.requested_at).toLocaleDateString('en-IN')}`}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => approveUser(u.id)}
                      disabled={approving === u.id}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                    >
                      <CheckCircle className="h-4 w-4" /> Approve
                    </button>
                    <button
                      onClick={() => rejectUser(u.id)}
                      disabled={approving === u.id}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                    >
                      <XCircle className="h-4 w-4" /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Super Admin: pending assignment / transfer requests */}
      {isSuperAdmin && pendingReqs.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="h-5 w-5 text-amber-600" />
            <h3 className="font-semibold text-gray-900">
              Pending Assignment / Transfer Requests ({pendingReqs.length})
            </h3>
          </div>
          {actionError && (
            <div className="bg-red-50 text-red-700 px-4 py-2.5 rounded-lg text-sm border border-red-200 mb-4">{actionError}</div>
          )}
          <div className="space-y-3">
            {pendingReqs.map(r => {
              const typeLabel = r.request_type === 'doctor_to_admin' ? 'Doctor → Hospital' : 'Assistant → Doctor'
              return (
                <div key={r.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <div>
                    <div className="font-medium text-gray-900">
                      {r.from_user_name || 'Unknown'} <span className="text-gray-400">→</span> {r.to_user_name || 'Unknown'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {typeLabel} · {new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      {r.reason ? ` · "${r.reason}"` : ''}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => resolveRequest(r.id, 'approved')}
                      disabled={approving === r.id}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                    >
                      <CheckCircle className="h-4 w-4" /> Approve
                    </button>
                    <button
                      onClick={() => resolveRequest(r.id, 'rejected')}
                      disabled={approving === r.id}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                    >
                      <XCircle className="h-4 w-4" /> Reject
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="inline-flex p-2 rounded-lg bg-emerald-50 text-emerald-600 mb-3">
            <Users className="h-5 w-5" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.patientsToday}</div>
          <div className="text-sm text-gray-500">{t("patients_today")}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="inline-flex p-2 rounded-lg bg-blue-50 text-blue-600 mb-3">
            <FileText className="h-5 w-5" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.casesThisWeek}</div>
          <div className="text-sm text-gray-500">{t("cases_this_week")}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="inline-flex p-2 rounded-lg bg-purple-50 text-purple-600 mb-3">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.totalCases}</div>
          <div className="text-sm text-gray-500">{t("total_cases")}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">{t("cases_per_stream")}</h3>
          {streamData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={streamData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stream" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">{t("no_data")}</div>
          )}
        </div>
      </div>
    </div>
  )
}
