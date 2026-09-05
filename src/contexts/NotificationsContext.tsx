import { createContext, useContext, useEffect, useState, useCallback } from "react"
import type { ReactNode } from "react"
import { apiClient } from "../lib/apiClient"
import { useAuth } from "./AuthContext"

interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: string
  read: boolean
  link: string | null
  created_at: string
}

interface NotificationsContextType {
  notifications: Notification[]
  unreadCount: number
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  sendNotification: (userId: string, title: string, message: string, type?: string, link?: string) => Promise<void>
  refresh: () => Promise<void>
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined)

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([] as Notification[])

  const fetchNotifications = useCallback(async () => {
    if (!user) return
    const { data } = await apiClient
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50)
    setNotifications(data || [])
  }, [user])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  async function markAsRead(id: string) {
    await apiClient.from("notifications").update({ read: true }).eq("id", id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  async function markAllAsRead() {
    if (!user) return
    await apiClient.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  async function sendNotification(userId: string, title: string, message: string, type = "info", link?: string) {
    await apiClient.from("notifications").insert({
      user_id: userId,
      title,
      message,
      type,
      link: link || null,
    })
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, sendNotification, refresh: fetchNotifications }}>
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationsContext)
  if (!context) throw new Error("useNotifications must be used within NotificationsProvider")
  return context
}
