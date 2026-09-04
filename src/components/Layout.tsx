import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationsContext'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LogOut, Users, FileText, BarChart3, Home, UserPlus, Users as UsersIcon, Bell, ChevronDown, Menu, X } from 'lucide-react'

export default function Layout({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuth()
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const [showNotifs, setShowNotifs] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  function toggleLang() {
    const newLang = i18n.language === 'en' ? 'hi' : 'en'
    i18n.changeLanguage(newLang)
    localStorage.setItem('ayush_lang', newLang)
  }

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  const navItems = [
    { path: '/', label: t('nav_dashboard'), icon: Home },
    ...((profile?.role === 'doctor' || profile?.role === 'assistant') ? [
      { path: '/patients/new', label: t('nav_new_patient'), icon: UserPlus },
      { path: '/patients', label: t('nav_patients'), icon: Users },
    ] : []),
    { path: '/cases', label: t('nav_cases'), icon: FileText },
  ]
  if ((profile?.role === 'hospital' && profile?.approved) || profile?.role === 'super_admin') {
    navItems.push({ path: '/admin', label: 'Overview', icon: BarChart3 })
  }
  if (profile?.role === 'super_admin' || profile?.role === 'hospital' || profile?.role === 'doctor') {
    navItems.push({ path: '/users', label: t('nav_users') || 'Users', icon: UsersIcon })
  }

  const roleLabel = profile?.role === 'super_admin' ? 'CMO (Chief Medical Officer)' : profile?.role === 'hospital' ? 'Hospital Admin' : profile?.role?.charAt(0).toUpperCase() + (profile?.role?.slice(1) || '')

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex flex-col">
      {/* Government Top Strip */}
      <div className="bg-gradient-to-r from-[#1a237e] via-[#283593] to-[#1a237e] text-white text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span className="opacity-90 font-medium">Bharat Sarkar | Government of India</span>
          <span className="bg-[#FF9933] text-[#1a237e] text-[10px] px-2 py-0.5 rounded font-bold uppercase">Official</span>
        </div>
      </div>
      <div className="h-1 bg-gradient-to-r from-[#FF9933] via-[#138808] to-[#FF9933]" />
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 hover:bg-gray-100 rounded-lg">
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[#1a237e] to-[#283593] rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
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
                  <h1 className="text-lg font-bold text-[#1a237e] leading-tight">Ayush Case-Taking</h1>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Ministry of Ayush, Government of India</p>
                </div>
              </div>
            </div>
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path
                return (
                  <button key={item.path} onClick={() => navigate(item.path)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-[#FF9933]/10 text-[#FF9933] border-b-2 border-[#FF9933]' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                )
              })}
            </nav>
            <div className="flex items-center gap-2">
              <button onClick={toggleLang} className="px-3 py-1.5 text-xs font-semibold bg-[#138808]/10 text-[#138808] rounded-md hover:bg-[#138808]/20 transition-colors border border-[#138808]/20">
                {t('lang_toggle')}
              </button>
              <div className="relative">
                <button onClick={() => setShowNotifs(!showNotifs)} className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-bold">{unreadCount > 9 ? '9+' : unreadCount}</span>}
                </button>
                {showNotifs && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 max-h-96 overflow-y-auto">
                    <div className="flex items-center justify-between p-3 border-b bg-gray-50 rounded-t-xl">
                      <h3 className="font-semibold text-gray-800 text-sm">Notifications</h3>
                      {unreadCount > 0 && <button onClick={markAllAsRead} className="text-xs text-[#1a237e] hover:underline font-medium">Mark all read</button>}
                    </div>
                    {notifications.length === 0 ? <p className="p-4 text-sm text-gray-500 text-center">No notifications</p> : notifications.slice(0, 20).map(n => (
                      <div key={n.id} onClick={() => { markAsRead(n.id); if (n.link) navigate(n.link); setShowNotifs(false); }}
                        className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${!n.read ? 'bg-[#1a237e]/5' : ''}`}>
                        <p className={`text-sm ${!n.read ? 'font-medium text-gray-800' : 'text-gray-600'}`}>{n.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                        <p className="text-[10px] text-gray-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative">
                <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="w-8 h-8 bg-gradient-to-br from-[#1a237e] to-[#283593] rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">{profile?.full_name?.charAt(0) || '?'}</div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-medium text-gray-800">{profile?.full_name}</p>
                    <p className="text-[10px] text-gray-500">{roleLabel}</p>
                  </div>
                  <ChevronDown className="h-3 w-3 text-gray-400" />
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden">
                    <div className="p-3 border-b bg-gray-50">
                      <p className="font-semibold text-sm text-gray-800">{profile?.full_name}</p>
                      <p className="text-xs text-gray-500">{roleLabel}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{profile?.email}</p>
                    </div>
                    <button onClick={handleSignOut} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b shadow-lg">
          <div className="px-4 py-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <button key={item.path} onClick={() => { navigate(item.path); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium ${isActive ? 'bg-[#FF9933]/10 text-[#FF9933]' : 'text-gray-600 hover:bg-gray-50'}`}>
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              )
            })}
          </div>
        </div>
      )}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        {children}
      </main>
      <footer className="bg-gradient-to-r from-[#1a237e] via-[#283593] to-[#1a237e] text-white mt-auto">
        <div className="h-1 bg-gradient-to-r from-[#FF9933] via-[#138808] to-[#FF9933]" />
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#FF9933] rounded-full flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 100 100" className="w-6 h-6"><circle cx="50" cy="50" r="45" fill="none" stroke="white" strokeWidth="3"/><circle cx="50" cy="50" r="8" fill="white"/></svg>
              </div>
              <div>
                <p className="text-xs font-semibold">Ayush Case-Taking Software</p>
                <p className="text-[10px] opacity-70">Ministry of Ayush, Government of India</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-[10px] opacity-60">
              <span>Privacy Policy</span><span>|</span><span>Terms of Use</span><span>|</span><span>Accessibility</span>
            </div>
            <p className="text-[10px] opacity-50">Designed for National Digital Health Mission</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
