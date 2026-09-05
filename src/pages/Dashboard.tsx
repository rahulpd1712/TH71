import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../lib/apiClient'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from 'react-i18next'
import { UserPlus, FileText, Users, Activity } from 'lucide-react'

interface Stats {
  patientsToday: number
  casesThisWeek: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({ patientsToday: 0, casesThisWeek: 0 })
  const { profile } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()

  useEffect(() => {
    async function loadStats() {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)

      const { count: patientsToday } = await apiClient.from('patients').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString())
      const { count: casesThisWeek } = await apiClient.from('cases').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo.toISOString())
      setStats({ patientsToday: patientsToday || 0, casesThisWeek: casesThisWeek || 0 })
    }
    loadStats()
  }, [])

  const displayName = profile?.role === 'super_admin' ? 'CMO' : profile?.role === 'hospital' ? 'Hospital' : profile?.full_name || ''

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#1a237e] to-[#283593] rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <svg viewBox="0 0 100 100" className="w-10 h-10">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#FF9933" strokeWidth="3"/>
              <circle cx="50" cy="50" r="8" fill="#FF9933"/>
              {Array.from({length: 24}).map((_, i) => {
                const angle = (i * 15) * Math.PI / 180
                const x1 = 50 + 12 * Math.cos(angle)
                const y1 = 50 + 12 * Math.sin(angle)
                const x2 = 50 + 42 * Math.cos(angle)
                const y2 = 50 + 42 * Math.sin(angle)
                return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#FF9933" strokeWidth="1.5"/>
              })}
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold">{t("welcome")} {displayName}</h2>
            <p className="text-sm text-white/70">{t("practice_overview")}</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-[#138808]/10 rounded-lg flex items-center justify-center">
              <UserPlus className="h-5 w-5 text-[#138808]" />
            </div>
            <p className="text-sm text-gray-500 font-medium">{t("patients_today")}</p>
          </div>
          <p className="text-3xl font-bold text-[#138808]">{stats.patientsToday}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-[#FF9933]/10 rounded-lg flex items-center justify-center">
              <FileText className="h-5 w-5 text-[#FF9933]" />
            </div>
            <p className="text-sm text-gray-500 font-medium">{t("cases_this_week")}</p>
          </div>
          <p className="text-3xl font-bold text-[#FF9933]">{stats.casesThisWeek}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3">
        {(profile?.role === 'doctor' || profile?.role === 'assistant') && (
          <button onClick={() => navigate('/patients/new')} className="bg-gradient-to-br from-[#138808] to-[#1a9e0a] text-white rounded-xl p-4 flex flex-col items-center gap-2 hover:shadow-lg transition-all">
            <UserPlus className="h-6 w-6" />
            <span className="text-sm font-medium">{t("new_patient")}</span>
          </button>
        )}
        <button onClick={() => navigate('/cases')} className="bg-gradient-to-br from-[#1a237e] to-[#283593] text-white rounded-xl p-4 flex flex-col items-center gap-2 hover:shadow-lg transition-all">
          <FileText className="h-6 w-6" />
          <span className="text-sm font-medium">{t("view_cases")}</span>
        </button>
        {(profile?.role === 'doctor' || profile?.role === 'assistant') && (
          <button onClick={() => navigate('/patients')} className="bg-gradient-to-br from-[#FF9933] to-[#e68a00] text-white rounded-xl p-4 flex flex-col items-center gap-2 hover:shadow-lg transition-all">
            <Users className="h-6 w-6" />
            <span className="text-sm font-medium">{t("view_all_patients")}</span>
          </button>
        )}
      </div>

      {/* Quick Start */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-5 w-5 text-[#1a237e]" />
          <h3 className="font-semibold text-gray-900">Quick Start</h3>
        </div>
        <div className="space-y-2">
          {(profile?.role === 'doctor' || profile?.role === 'assistant') && (
            <button onClick={() => navigate('/patients/new')} className="w-full text-left p-3 rounded-lg hover:bg-gray-50 flex items-center gap-3 transition-colors">
              <div className="bg-[#138808]/10 p-2 rounded-lg"><UserPlus className="h-4 w-4 text-[#138808]" /></div>
              <div>
                <p className="text-sm font-medium text-gray-900">{t("register_new_patient")}</p>
                <p className="text-xs text-gray-500">{t("register_desc")}</p>
              </div>
            </button>
          )}
          <button onClick={() => navigate('/cases')} className="w-full text-left p-3 rounded-lg hover:bg-gray-50 flex items-center gap-3 transition-colors">
            <div className="bg-[#FF9933]/10 p-2 rounded-lg"><FileText className="h-4 w-4 text-[#FF9933]" /></div>
            <div>
              <p className="text-sm font-medium text-gray-900">{t("view_cases")}</p>
              <p className="text-xs text-gray-500">Review past case files</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
