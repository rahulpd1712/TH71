import { useAuth } from '../contexts/AuthContext'
import { Navigate } from 'react-router-dom'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, profile, isApproved } = useAuth()
  
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

  // If user is an admin but not approved (and not super_admin), redirect to pending page
  if (profile && (profile.role === 'hospital' || profile.role === 'admin') && !profile.approved) {
    return <Navigate to="/pending-approval" replace />
  }
  
  return <>{children}</>
}
