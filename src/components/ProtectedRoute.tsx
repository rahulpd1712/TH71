import { useAuth } from '../contexts/AuthContext'
import { Navigate, useLocation } from 'react-router-dom'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, profile, isApproved } = useAuth()
  const location = useLocation()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100">
        <div className="text-emerald-600 text-lg font-medium">Loading...</div>
      </div>
    )
  }
  
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Any account that has not been approved by the CMO (super admin)
  // sees the pending-approval screen; super_admin accounts are always
  // created approved. The pending-approval route itself must render
  // (not redirect to itself) or the app loops with a blank page.
  if (profile && profile.role !== 'super_admin' && !profile.approved && location.pathname !== '/pending-approval') {
    return <Navigate to="/pending-approval" replace />
  }
  
  return <>{children}</>
}
