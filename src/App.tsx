import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { NotificationsProvider } from './contexts/NotificationsContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import PendingApproval from './pages/PendingApproval'
import PatientRegistration from './pages/PatientRegistration'
import PatientsList from './pages/PatientsList'
import PatientHistory from './pages/PatientHistory'
import NewCase from './pages/NewCase'
import CasesList from './pages/CasesList'
import CaseView from './pages/CaseView'
import AdminDashboard from './pages/AdminDashboard'
import UserManagement from './pages/UserManagement'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationsProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected routes */}
          <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
          <Route path="/patients/new" element={<ProtectedRoute><Layout><PatientRegistration /></Layout></ProtectedRoute>} />
          <Route path="/patients" element={<ProtectedRoute><Layout><PatientsList /></Layout></ProtectedRoute>} />
          <Route path="/patients/:patientId/history" element={<ProtectedRoute><Layout><PatientHistory /></Layout></ProtectedRoute>} />
          <Route path="/cases/new" element={<ProtectedRoute><Layout><NewCase /></Layout></ProtectedRoute>} />
          <Route path="/cases" element={<ProtectedRoute><Layout><CasesList /></Layout></ProtectedRoute>} />
          <Route path="/cases/:id" element={<ProtectedRoute><Layout><CaseView /></Layout></ProtectedRoute>} />
          <Route path="/pending-approval" element={<ProtectedRoute><PendingApproval /></ProtectedRoute>} />
                    <Route path="/users" element={<ProtectedRoute><Layout><UserManagement /></Layout></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><Layout><AdminDashboard /></Layout></ProtectedRoute>} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </NotificationsProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
