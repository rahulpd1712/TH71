import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { UserPlus } from 'lucide-react'

export default function PatientRegistration() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    age: '',
    gender: '',
    contact: '',
    abha_id: '',
  })

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    // NB: do NOT chain .select().single() here — the API shim treats a
    // trailing .select() as a plain read and would skip the insert
    // entirely (silently returning the newest existing patient).
    const { data, error: insertError } = await supabase
      .from('patients')
      .insert({
        name: form.name,
        age: parseInt(form.age),
        gender: form.gender,
        contact: form.contact || null,
        abha_id: form.abha_id || null,
      })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    const newId = data && (data.patient ? data.patient.id : data.id)
    if (!newId) {
      setError('Patient was created but the response was malformed. Please refresh the list.')
      setLoading(false)
      return
    }

    // Keep the dashboard's counters fresh without a manual reload
    window.dispatchEvent(new Event('ayush-stats-changed'))
    navigate(`/cases/new?patient_id=${newId}`)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-emerald-100 p-3 rounded-xl">
          <UserPlus className="h-6 w-6 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t("new_patient_page")}</h2>
          <p className="text-sm text-gray-500">{t("fill_patient_details")}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("full_name_required")}</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            placeholder="Patient full name"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("age_required")}</label>
            <input
              type="number"
              value={form.age}
              onChange={(e) => updateField('age', e.target.value)}
              required
              min={0}
              max={150}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              placeholder="Age"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("gender_required")}</label>
            <select
              value={form.gender}
              onChange={(e) => updateField('gender', e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            >
              <option value="">{t("select_gender")}</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("contact_number")}</label>
          <input
            type="tel"
            value={form.contact}
            onChange={(e) => updateField('contact', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            placeholder="+91 98765 43210"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ABHA ID (optional)</label>
          <input
            type="text"
            value={form.abha_id}
            onChange={(e) => updateField('abha_id', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            placeholder="ABHA health ID"
          />
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm">{error}</div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-emerald-600 text-white py-2 rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            {loading ? t('saving') : t('register_patient')}
          </button>
        </div>
      </form>
    </div>
  )
}
