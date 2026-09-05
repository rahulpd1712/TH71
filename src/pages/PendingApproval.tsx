import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ShieldAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function PendingApproval() {
  const { profile, signOut, refreshProfile } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()

  // Once the CMO approves the account, leave this screen automatically.
  useEffect(() => {
    if (profile && profile.role !== 'super_admin' && profile.approved) {
      navigate('/', { replace: true })
    }
  }, [profile, navigate])
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
        <div className="bg-amber-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <ShieldAlert className="h-8 w-8 text-amber-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t("approval_pending")}</h1>
        <p className="text-gray-500 mb-6">
          Your <span className="font-medium capitalize">{profile?.role}</span> account is awaiting approval from the super admin.
          You will receive access once approved.
        </p>
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-600">
            <strong>Name:</strong> {profile?.full_name || 'N/A'}<br />
            <strong>Role:</strong> <span className="capitalize">{profile?.role}</span><br />
            <strong>Status:</strong> <span className="text-amber-600 font-medium">Pending Approval</span>
          </p>
        </div>
        <button
          onClick={refreshProfile}
          className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors mb-2"
        >
          Check Status
        </button>
        <button
          onClick={signOut}
          className="w-full bg-gray-200 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-300 transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}
