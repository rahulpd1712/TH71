import { useState } from 'react'
import { useAuth } from "../contexts/AuthContext"
import type { UserRole } from "../lib/apiClient"
import { useNavigate } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [doctorId, setDoctorId] = useState('')
  const [hospitalName, setHospitalName] = useState('')
  const [role, setRole] = useState<UserRole>('doctor')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await signUp(email, password, fullName, role, phone, doctorId, hospitalName)
    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      navigate('/')
    }
  }

  const fieldClass = "w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a237e]/30 focus:border-[#1a237e] outline-none transition-all"

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#f0f2f5] to-[#e8eaf6]">
      <div className="bg-gradient-to-r from-[#1a237e] via-[#283593] to-[#1a237e] text-white text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span className="opacity-90 font-medium">Bharat Sarkar | Government of India</span>
          <span className="bg-[#FF9933] text-[#1a237e] text-[10px] px-2 py-0.5 rounded font-bold uppercase">Official</span>
        </div>
      </div>
      <div className="h-1 bg-gradient-to-r from-[#FF9933] via-[#138808] to-[#FF9933]" />
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-100">
          <div className="flex flex-col items-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-[#1a237e] to-[#283593] rounded-full flex items-center justify-center mb-4 shadow-lg">
              <svg viewBox="0 0 100 100" className="w-16 h-16">
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
            <h1 className="text-2xl font-bold text-[#1a237e]">Ayush Case-Taking</h1>
            <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">Ministry of Ayush, Government of India</p>
            <div className="flex items-center gap-2 mt-3">
              <UserPlus className="h-4 w-4 text-[#FF9933]" />
              <p className="text-sm text-gray-600 font-medium">{t("create_account")}</p>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("full_name")}</label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required className={fieldClass} placeholder="Dr. Sharma" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("email")}</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={fieldClass} placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("password")}</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className={fieldClass} placeholder="Min 6 characters" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required className={fieldClass} placeholder="9876543210" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value as UserRole)} className={fieldClass}>
                <option value="doctor">Doctor</option>
                <option value="assistant">Assistant</option>
                <option value="hospital">Hospital (requires CMO approval)</option>
              </select>
              {role === 'hospital' && (
                <p className="text-xs text-amber-600 mt-1 bg-amber-50 px-3 py-1.5 rounded-md border border-amber-200">Hospital accounts require CMO approval.</p>
              )}
            </div>
            {(role === 'doctor' || role === 'assistant') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Doctor ID *</label>
                <input type="text" value={doctorId} onChange={(e) => setDoctorId(e.target.value)} required className={fieldClass} placeholder="DOC-12345" />
              </div>
            )}
            {role === 'hospital' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hospital Name *</label>
                <input type="text" value={hospitalName} onChange={(e) => setHospitalName(e.target.value)} required className={fieldClass} placeholder="City Hospital" />
              </div>
            )}
            {error && <div className="bg-red-50 text-red-700 px-4 py-2.5 rounded-lg text-sm border border-red-200">{error}</div>}
            <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-[#1a237e] to-[#283593] text-white py-3 rounded-lg font-semibold hover:from-[#283593] hover:to-[#1a237e] disabled:opacity-50 transition-all shadow-md hover:shadow-lg">
              {loading ? t('creating_account') : t('sign_up')}
            </button>
          </form>
          <p className="mt-4 text-center text-sm text-gray-500">
            {t('have_account')}{' '}
            <a href="/login" className="text-[#FF9933] font-semibold hover:underline">{t("sign_in")}</a>
          </p>
        </div>
      </div>
      <footer className="bg-gradient-to-r from-[#1a237e] via-[#283593] to-[#1a237e] text-white">
        <div className="h-1 bg-gradient-to-r from-[#FF9933] via-[#138808] to-[#FF9933]" />
        <div className="max-w-7xl mx-auto px-4 py-4 text-center">
          <p className="text-[10px] opacity-60">Designed for National Digital Health Mission | Ministry of Ayush, Government of India</p>
        </div>
      </footer>
    </div>
  )
}
