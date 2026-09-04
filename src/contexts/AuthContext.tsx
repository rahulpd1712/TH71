import { createContext, useContext, useEffect, useState } from "react"
import type { ReactNode } from "react"
import { supabase } from "../lib/supabase"
import type { UserProfile, UserRole } from "../lib/supabase"

interface LocalUser { id: string; email?: string; role?: string; full_name?: string }
interface LocalSession { user: LocalUser; access_token?: string }
interface AuthContextType {
  user: LocalUser | null
  profile: UserProfile | null
  session: LocalSession | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (email: string, password: string, fullName: string, role: UserRole, phone?: string, doctorId?: string, hospitalName?: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  isApproved: boolean
  isSuperAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<LocalUser | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<LocalSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data as UserProfile | null)
    setLoading(false)
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    return {}
  }

  async function signUp(email: string, password: string, fullName: string, role: UserRole, phone?: string, doctorId?: string, hospitalName?: string) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
          phone: phone || null,
          doctor_id: doctorId || null,
          hospital_name: hospitalName || null,
          requested_at: new Date().toISOString(),
        },
      },
    })
    if (error) return { error: error.message }
    return {}
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  const isApproved = profile?.approved ?? false
  const isSuperAdmin = profile?.role === 'super_admin' && profile?.approved

  return (
    <AuthContext.Provider value={{ user, profile, session, loading, signIn, signUp, signOut, isApproved, isSuperAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
