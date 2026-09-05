import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useTranslation } from 'react-i18next'
import { Users, Search, Eye, ArrowUpDown } from 'lucide-react'

interface Patient {
  id: string
  name: string
  age: number
  gender: string
  contact: string | null
  abha_id: string | null
  created_at: string
}

export default function PatientsList() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [sortAsc, setSortAsc] = useState(true)
  const navigate = useNavigate()
  const { t } = useTranslation()

  async function loadPatients() {
    setLoading(true)
    let query = supabase
      .from('patients')
      .select('*')

    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    const { data } = await query
    const sorted = (data || []).sort((a: Patient, b: Patient) =>
      sortAsc
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name)
    )
    setPatients(sorted)
    setLoading(false)
  }

  useEffect(() => {
    const timer = setTimeout(() => loadPatients(), 300)
    return () => clearTimeout(timer)
  }, [search])

  function toggleSort() {
    setSortAsc(!sortAsc)
    setPatients(prev =>
      [...prev].sort((a, b) =>
        !sortAsc
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name)
      )
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-3 rounded-xl">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{t("nav_patients")}</h2>
            <p className="text-sm text-gray-500">{patients.length} {t("patients_registered")}</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/patients/new')}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700"
        >
          + New Patient
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("search_by_name")}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">{t("loading")}</div>
        ) : patients.length === 0 ? (
          <div className="p-8 text-center text-gray-500">{t("no_patients")}</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                  <button onClick={toggleSort} className="inline-flex items-center gap-1 hover:text-gray-900">
                    {t("name")} <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">{t("age")}</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">{t("gender")}</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">{t("contact")}</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">{t("actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {patients.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                  <td className="px-4 py-3 text-gray-600">{p.age}</td>
                  <td className="px-4 py-3 text-gray-600">{p.gender}</td>
                  <td className="px-4 py-3 text-gray-600">{p.contact || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => navigate(`/patients/${p.id}/history`)}
                      className="text-emerald-600 hover:text-emerald-700 font-medium text-sm inline-flex items-center gap-1"
                    >
                      <Eye className="h-4 w-4" /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
