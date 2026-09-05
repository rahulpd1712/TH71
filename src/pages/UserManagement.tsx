import { useAuth } from "../contexts/AuthContext"
import { useTranslation } from "react-i18next"
import { useNotifications } from "../contexts/NotificationsContext"
import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import { Shield, Check, X, ChevronDown, ChevronRight } from "lucide-react"

interface UP { id: string; role: string; full_name: string | null; approved: boolean; created_at: string; assigned_admin_id: string | null; assigned_doctor_id: string | null; phone: string | null; doctor_id: string | null; hospital_name: string | null }
interface Req { id: string; from_user_id: string; to_user_id: string; request_type: string; status: string; reason: string | null; created_at: string; resolved_at: string | null; resolved_by: string | null }

function UserCard({ u, cc, admins, doctors }: { u: UP; cc: number; admins: UP[]; doctors: UP[] }) {
  const bm: Record<string, string> = {
    super_admin: "bg-purple-100 text-purple-700 border-purple-200",
    hospital: "bg-blue-100 text-blue-700 border-blue-200", admin: "bg-blue-100 text-blue-700 border-blue-200",
    doctor: "bg-emerald-100 text-emerald-700 border-emerald-200",
    assistant: "bg-orange-100 text-orange-700 border-orange-200"
  }
  const adminName = u.assigned_admin_id ? admins.find(a => a.id === u.assigned_admin_id)?.full_name : null
  const doctorName = u.assigned_doctor_id ? doctors.find(d => d.id === u.assigned_doctor_id)?.full_name : null
  return (
    <div className="p-3 bg-white rounded-lg border border-gray-100 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="font-medium text-gray-800">{u.full_name || "Unnamed"}</p>
          <p className="text-xs text-gray-500">{u.role.replace(/_/g, " ")} · Joined {new Date(u.created_at).toLocaleDateString()}</p>
          {adminName && <p className="text-xs text-blue-600">Reports to: {adminName}</p>}
          {doctorName && <p className="text-xs text-emerald-600">Works under: {doctorName}</p>}
          {(u.role === "doctor" || u.role === "assistant") && u.phone && <p className="text-xs text-gray-500">Phone: {u.phone}</p>}
          {(u.role === "doctor" || u.role === "assistant") && u.doctor_id && <p className="text-xs text-gray-500">ID: {u.doctor_id}</p>}
          {u.role === "hospital" && u.hospital_name && <p className="text-xs text-gray-500">Hospital: {u.hospital_name}</p>}
        </div>
        <div className="flex items-center gap-2">
          {cc > 0 && <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">{cc} cases</span>}
          <span className={"text-xs px-2 py-1 rounded-full font-medium " + (bm[u.role] || "bg-gray-100")}>{u.role}</span>
          <span className={"w-2 h-2 rounded-full " + (u.approved ? "bg-green-500" : "bg-yellow-500")} />
        </div>
      </div>
    </div>
  )
}

function RequestCard({ req, users, onResolve }: { req: Req; users: UP[]; onResolve: (id: string, status: string) => void }) {
  const from = users.find(u => u.id === req.from_user_id)
  const to = users.find(u => u.id === req.to_user_id)
  const typeLabel = req.request_type === "doctor_to_admin" ? "Doctor requesting Hospital" : "Assistant requesting Doctor"
  return (
    <div className="p-3 bg-white rounded-lg border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-gray-800">{from?.full_name || "Unknown"} → {to?.full_name || "Unknown"}</p>
          <p className="text-xs text-gray-500">{typeLabel} · {new Date(req.created_at).toLocaleDateString()}</p>
          {req.reason && <p className="text-xs text-gray-600 mt-1 italic">"{req.reason}"</p>}
        </div>
        <div className="flex items-center gap-2">
          <span className={"text-xs px-2 py-1 rounded-full font-medium " +
            (req.status === "pending" ? "bg-yellow-100 text-yellow-700" :
             req.status === "approved" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
            {req.status}
          </span>
          {req.status === "pending" && (
            <div className="flex gap-1">
              <button onClick={() => onResolve(req.id, "approved")} className="p-1 bg-green-100 text-green-700 rounded hover:bg-green-200">
                <Check className="h-4 w-4" />
              </button>
              <button onClick={() => onResolve(req.id, "rejected")} className="p-1 bg-red-100 text-red-700 rounded hover:bg-red-200">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function UserManagement() {
  const { profile } = useAuth()
  const { t } = useTranslation()
  const { sendNotification } = useNotifications()
  const [users, setUsers] = useState([] as UP[])
  const [requests, setRequests] = useState([] as Req[])
  const [cc, setCc] = useState({} as Record<string, number>)
  const [loading, setLoading] = useState(true)

  const [expandedSections, setExpandedSections] = useState({} as Record<string, boolean>)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    const { data: u } = await supabase.from("users").select("*").order("created_at", { ascending: false })
    const { data: c } = await supabase.from("cases").select("doctor_id")
    const { data: r } = await supabase.from("assignment_requests").select("*").order("created_at", { ascending: false })
    const ct: Record<string, number> = {}
    if (c) c.forEach((x: any) => { ct[x.doctor_id] = (ct[x.doctor_id] || 0) + 1 })
    setUsers(u || []); setCc(ct); setRequests(r || []); setLoading(false)
  }

  async function handleDirectAssign(userId: string, field: string, value: string | null) {
    const update: any = {}
    update[field] = value
    await supabase.from("users").update(update).eq("id", userId)
    fetchData()
  }

  async function handleRequest(targetUserId: string, requestType: string) {
    const typeLabel = requestType === "doctor_to_admin" ? "Admin" : "Doctor"
    const target = users.find(u => u.id === targetUserId)
    if (!target) return
    const reason = prompt(`Enter reason for requesting to join ${target.full_name} (${typeLabel}):`)
    if (reason === null) return
    await supabase.from("assignment_requests").insert({
      from_user_id: profile!.id,
      to_user_id: targetUserId,
      request_type: requestType,
      reason: reason || null,
      status: "pending"
    })
    await sendNotification(targetUserId, "New Assignment Request", profile?.full_name + " wants to join you as " + typeLabel, "request", "/users")
    fetchData()
  }

  async function handleResolve(requestId: string, status: string) {
    await supabase.from("assignment_requests").update({
      status,
      resolved_at: new Date().toISOString(),
      resolved_by: profile!.id
    }).eq("id", requestId)
    const req = requests.find(r => r.id === requestId)
    if (req) {
      await sendNotification(req.from_user_id, "Request " + status.charAt(0).toUpperCase() + status.slice(1), profile?.full_name + " has " + status + " your assignment request", status === "approved" ? "success" : "error", "/users")
    }

    if (status === "approved") {
      const req = requests.find(r => r.id === requestId)
      if (req) {
        if (req.request_type === "doctor_to_admin") {
          await supabase.from("users").update({ assigned_admin_id: req.to_user_id }).eq("id", req.from_user_id)
        } else {
          await supabase.from("users").update({ assigned_doctor_id: req.to_user_id }).eq("id", req.from_user_id)
        }
      }
    }
    fetchData()
  }

  function toggleSection(key: string) {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }))
  }

  if (profile?.role !== "super_admin" && profile?.role !== "admin" && profile?.role !== "hospital" && profile?.role !== "doctor" && profile?.role !== "assistant") {
    return (
      <div className="text-center py-12">
        <Shield className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-700">Access Denied</h2>
        <p className="text-gray-500 mt-2">Only Super Admins, Hospitals, and Doctors can view this page.</p>
      </div>
    )
  }

  if (loading) return <div className="text-center py-12"><p className="text-gray-500">Loading users...</p></div>

  const sa = users.filter(u => u.role === "super_admin")
  const ad = users.filter(u => u.role === "hospital" || u.role === "admin")
  const dr = users.filter(u => u.role === "doctor")
  const ast = users.filter(u => u.role === "assistant")
  const pendingReqs = requests.filter(r => r.status === "pending")
  const myPendingAsTarget = pendingReqs.filter(r => r.to_user_id === profile?.id)
  const myPendingAsFrom = pendingReqs.filter(r => r.from_user_id === profile?.id)

  const isSuperAdmin = profile?.role === "super_admin"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t("user_management")}</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-purple-50 rounded-xl p-4">
          <p className="text-sm font-medium text-purple-700">Super Admins</p>
          <p className="text-2xl font-bold text-purple-900">{sa.length}</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4">
          <p className="text-sm font-medium text-blue-700">Hospitals</p>
          <p className="text-2xl font-bold text-blue-900">{ad.length}</p>
        </div>
        <div className="bg-emerald-50 rounded-xl p-4">
          <p className="text-sm font-medium text-emerald-700">Doctors</p>
          <p className="text-2xl font-bold text-emerald-900">{dr.length}</p>
        </div>
        <div className="bg-orange-50 rounded-xl p-4">
          <p className="text-sm font-medium text-orange-700">Assistants</p>
          <p className="text-2xl font-bold text-orange-900">{ast.length}</p>
        </div>
      </div>

      {/* Pending Requests - Super Admin */}
      {isSuperAdmin && myPendingAsTarget.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <h2 className="text-lg font-semibold text-yellow-800 mb-3">Pending Assignment Requests ({myPendingAsTarget.length})</h2>
          <div className="space-y-2">
            {myPendingAsTarget.map(r => <RequestCard key={r.id} req={r} users={users} onResolve={handleResolve} />)}
          </div>
        </div>
      )}

      {/* Pending Requests - Admin */}
      {!isSuperAdmin && profile?.role === "hospital" && myPendingAsTarget.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <h2 className="text-lg font-semibold text-yellow-800 mb-3">Pending Requests From Doctors ({myPendingAsTarget.length})</h2>
          <div className="space-y-2">
            {myPendingAsTarget.map(r => <RequestCard key={r.id} req={r} users={users} onResolve={handleResolve} />)}
          </div>
        </div>
      )}

      {/* Pending Requests - Doctor */}
      {!isSuperAdmin && profile?.role === "doctor" && myPendingAsTarget.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <h2 className="text-lg font-semibold text-yellow-800 mb-3">Pending Requests From Assistants ({myPendingAsTarget.length})</h2>
          <div className="space-y-2">
            {myPendingAsTarget.map(r => <RequestCard key={r.id} req={r} users={users} onResolve={handleResolve} />)}
          </div>
        </div>
      )}

      {/* My outgoing requests */}
      {myPendingAsFrom.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h2 className="text-lg font-semibold text-blue-800 mb-3">My Pending Requests ({myPendingAsFrom.length})</h2>
          <div className="space-y-2">
            {myPendingAsFrom.map(r => <RequestCard key={r.id} req={r} users={users} onResolve={() => {}} />)}
          </div>
        </div>
      )}

      {/* Super Admin: Direct Assignment Controls */}
      {isSuperAdmin && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <h2 className="text-lg font-semibold text-emerald-800 mb-3">Direct Assignment (Super Admin)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-emerald-700 mb-2">Assign Doctors to Hospitals</h3>
              <div className="space-y-2">
                {dr.map(d => (
                  <div key={d.id} className="flex items-center gap-2 p-2 bg-white rounded border border-gray-100">
                    <span className="text-sm text-gray-700 flex-1">{d.full_name || "Unnamed"}</span>
                    <select className="text-xs border rounded px-2 py-1" value={d.assigned_admin_id || ""} onChange={(e) => handleDirectAssign(d.id, "assigned_admin_id", e.target.value || null)}>
                      <option value="">Unassigned</option>
                      {ad.map(a => <option key={a.id} value={a.id}>{a.full_name}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-emerald-700 mb-2">Assign Assistants to Doctors</h3>
              <div className="space-y-2">
                {ast.map(a => (
                  <div key={a.id} className="flex items-center gap-2 p-2 bg-white rounded border border-gray-100">
                    <span className="text-sm text-gray-700 flex-1">{a.full_name || "Unnamed"}</span>
                    <select className="text-xs border rounded px-2 py-1" value={a.assigned_doctor_id || ""} onChange={(e) => handleDirectAssign(a.id, "assigned_doctor_id", e.target.value || null)}>
                      <option value="">Unassigned</option>
                      {dr.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Super Admin: All Requests */}
      {isSuperAdmin && requests.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">All Assignment Requests ({requests.length})</h2>
          <div className="space-y-2">
            {requests.map(r => <RequestCard key={r.id} req={r} users={users} onResolve={handleResolve} />)}
          </div>
        </div>
      )}

      {/* Hierarchy View */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Organization Hierarchy</h2>

        {sa.length > 0 && (
          <div className="mb-4">
            <button onClick={() => toggleSection("sa")} className="flex items-center gap-2 text-purple-800 font-semibold mb-2">
              {expandedSections["sa"] === false ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              Super Admins ({sa.length})
            </button>
            {expandedSections["sa"] !== false && (
              <div className="ml-6 space-y-2">
                {sa.map(u => <UserCard key={u.id} u={u} cc={cc[u.id] || 0} admins={ad} doctors={dr} />)}
              </div>
            )}
          </div>
        )}

        {ad.map(admin => {
          const adminDoctors = dr.filter(d => d.assigned_admin_id === admin.id)
          return (
            <div key={admin.id} className="mb-4 border-l-2 border-blue-200 pl-4">
              <button onClick={() => toggleSection("admin-" + admin.id)} className="flex items-center gap-2 text-blue-800 font-semibold mb-2">
                {expandedSections["admin-" + admin.id] === false ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                {admin.full_name || "Unnamed"} (Hospital) - {adminDoctors.length} doctors
              </button>
              {expandedSections["admin-" + admin.id] !== false && (
                <div className="ml-6 space-y-2">
                  {adminDoctors.length > 0 ? adminDoctors.map(doc => {
                    const docAssistants = ast.filter(a => a.assigned_doctor_id === doc.id)
                    return (
                      <div key={doc.id} className="border-l-2 border-emerald-200 pl-4">
                        <UserCard u={doc} cc={cc[doc.id] || 0} admins={ad} doctors={dr} />
                        {docAssistants.length > 0 && (
                          <div className="ml-6 border-l-2 border-orange-200 pl-4 mt-2 space-y-2">
                            {docAssistants.map(asst => <UserCard key={asst.id} u={asst} cc={0} admins={ad} doctors={dr} />)}
                          </div>
                        )}
                      </div>
                    )
                  }) : <p className="text-xs text-gray-500 ml-4">No doctors assigned.</p>}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Doctor View: Request to join admin */}
      {profile?.role === "doctor" && !profile?.assigned_admin_id && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <h2 className="text-lg font-semibold text-emerald-800 mb-3">You are not assigned to any Admin</h2>
          <p className="text-sm text-gray-600 mb-3">Request to join an admin:</p>
          <div className="flex flex-wrap gap-2">
            {ad.filter(a => a.approved).map(a => (
              <button key={a.id} onClick={() => handleRequest(a.id, "doctor_to_admin")}
                className="px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700">
                Request {a.full_name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Doctor View: Transfer admin */}
      {profile?.role === "doctor" && profile?.assigned_admin_id && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h2 className="text-lg font-semibold text-blue-800 mb-2">Transfer to Different Admin</h2>
          <p className="text-sm text-gray-600 mb-3">
            Currently assigned to: <strong>{ad.find(a => a.id === profile?.assigned_admin_id)?.full_name || "Unknown"}</strong>
          </p>
          <p className="text-sm text-gray-500 mb-3">Submit a transfer request to a different admin:</p>
          <div className="flex flex-wrap gap-2">
            {ad.filter(a => a.approved && a.id !== profile?.assigned_admin_id).map(a => (
              <button key={a.id} onClick={() => handleRequest(a.id, "doctor_to_admin")}
                className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                Request {a.full_name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Assistant View */}
      {profile?.role === "assistant" && !profile?.assigned_doctor_id && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <h2 className="text-lg font-semibold text-orange-800 mb-3">You are not assigned to any Doctor</h2>
          <p className="text-sm text-gray-600">Wait for a doctor or admin to assign you.</p>
        </div>
      )}

      {profile?.role === "assistant" && profile?.assigned_doctor_id && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <h2 className="text-lg font-semibold text-orange-800 mb-2">Transfer to Different Doctor</h2>
          <p className="text-sm text-gray-600 mb-3">
            Currently assigned to: <strong>{dr.find(d => d.id === profile?.assigned_doctor_id)?.full_name || "Unknown"}</strong>
          </p>
          <div className="flex flex-wrap gap-2">
            {dr.filter(d => d.id !== profile?.assigned_doctor_id).map(d => (
              <button key={d.id} onClick={() => handleRequest(d.id, "assistant_to_doctor")}
                className="px-3 py-1.5 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700">
                Request {d.full_name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
