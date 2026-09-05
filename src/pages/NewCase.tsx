import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import CommonCaseFields from '../components/forms/CommonCaseFields'
import AyurvedaForm from '../components/forms/AyurvedaForm'
import HomeopathyForm from '../components/forms/HomeopathyForm'
import UnaniForm from '../components/forms/UnaniForm'
import SiddhaForm from '../components/forms/SiddhaForm'
import DiagnosisAutocomplete from '../components/DiagnosisAutocomplete'
import { Stethoscope } from 'lucide-react'

type Stream = 'ayurveda' | 'homeopathy' | 'unani' | 'siddha' | null

interface Patient {
  id: string; name: string; age: number; gender: string
  contact: string | null; abha_id: string | null
}

interface PreviousCase {
  id: string
  created_at: string
  diagnosis: string | null
  stream: string
}

const STORAGE_KEY = 'ayush_case_draft'

interface DraftData {
  patientId: string | null
  stream: string | null
  commonData: any
  streamData: Record<string, unknown>
  diagnosis: string
  treatmentPlan: string
  namasteCode: string
  icd11Code: string
  followUpOf: string | null
}

function loadDraft(): DraftData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return null
}

function saveDraft(draft: DraftData) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(draft)) } catch { /* ignore */ }
}

function clearDraft() {
  try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
}

export default function NewCase() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const patientId = searchParams.get('patient_id')

  const [patient, setPatient] = useState<Patient | null>(null)
  const [previousCases, setPreviousCases] = useState<PreviousCase[]>([])

  // Load draft or defaults
  const draft = loadDraft()
  const [stream, setStream] = useState<Stream>((draft?.stream as Stream) || null)
  const [commonData, setCommonData] = useState(draft?.commonData || {
    chief_complaints: '', history_present_illness: '', past_history: '', family_history: '',
    personal_history: { diet: '', sleep: '', bowel: '', bladder: '', addictions: '' },
    vitals: { pulse: '', bp: '', temp: '', weight: '', height: '' },
  })
  const [streamData, setStreamData] = useState<Record<string, unknown>>(draft?.streamData || {})
  const [diagnosis, setDiagnosis] = useState(draft?.diagnosis || '')
  const [treatmentPlan, setTreatmentPlan] = useState(draft?.treatmentPlan || '')
  const [namasteCode, setNamasteCode] = useState(draft?.namasteCode || '')
  const [icd11Code, setIcd11Code] = useState(draft?.icd11Code || '')
  const [followUpOf, setFollowUpOf] = useState<string | null>(draft?.followUpOf || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Auto-save to localStorage on every change
  const autoSave = useCallback(() => {
    if (patientId || draft?.patientId) {
      saveDraft({
        patientId: patientId || draft?.patientId || null,
        stream, commonData, streamData, diagnosis, treatmentPlan, namasteCode, icd11Code, followUpOf,
      })
    }
  }, [patientId, stream, commonData, streamData, diagnosis, treatmentPlan, namasteCode, icd11Code, followUpOf])

  useEffect(() => { autoSave() }, [autoSave])

  // Load patient and previous cases
  useEffect(() => {
    const pid = patientId || draft?.patientId
    if (pid) {
      supabase.from('patients').select('*').eq('id', pid).single().then(({ data }) => setPatient(data))
      supabase.from('cases').select('id, created_at, diagnosis, stream')
        .eq('patient_id', pid)
        .order('created_at', { ascending: false })
        .limit(20)
        .then(({ data }) => setPreviousCases(data || []))
    }
  }, [patientId])

  async function handleSubmit() {
    if (!patient || !user || !stream) return
    setError(''); setLoading(true)
    const { error: insertError } = await supabase.from('cases').insert({
      patient_id: patient.id, doctor_id: user.id, stream,
      chief_complaints: commonData.chief_complaints,
      history_present_illness: commonData.history_present_illness,
      past_history: commonData.past_history, family_history: commonData.family_history,
      personal_history: commonData.personal_history, vitals: commonData.vitals,
      stream_specific_data: streamData, diagnosis: diagnosis || null,
      treatment_plan: treatmentPlan || null, namaste_code: namasteCode || null,
      icd11_tm2_code: icd11Code || null, follow_up_of: followUpOf || null,
    })
    if (insertError) { setError(insertError.message); setLoading(false); return }
    clearDraft()
    window.dispatchEvent(new Event('ayush-stats-changed'))
    navigate('/patients/' + patient.id + '/history')
  }

  function handleStreamChange(newStream: Stream) {
    setStream(newStream)
    setStreamData({})
  }

  if (!patientId && !draft?.patientId) return (
    <div className="text-center py-12">
      <p className="text-gray-500 mb-4">No patient selected. Please register a patient first.</p>
      <button onClick={() => navigate('/patients/new')} className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700">Register Patient</button>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="bg-emerald-100 p-3 rounded-xl"><Stethoscope className="h-6 w-6 text-emerald-600" /></div>
        <div><h2 className="text-2xl font-bold text-gray-900">{t('case_form')}</h2>
        <p className="text-sm text-gray-500">Patient: {patient?.name || 'Loading...'}</p></div>
      </div>
      {!stream && <StreamSelector onSelect={handleStreamChange} />}
      {stream && (
        <>
          {/* Offline indicator */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-sm text-amber-700 flex items-center gap-2">
            <span>💾</span>
            <span>Auto-saving to browser storage</span>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">{t('case_form')} - <span className="text-emerald-600 capitalize">{stream}</span></h3>
              <button onClick={() => handleStreamChange(null)} className="text-sm text-gray-500 hover:text-gray-700 underline">{t('change_stream')}</button>
            </div>
            <CommonCaseFields data={commonData} onChange={setCommonData} />
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="font-medium text-gray-900 mb-3 capitalize">{stream} fields</h4>
              {stream === 'ayurveda' && <AyurvedaForm data={streamData} onChange={setStreamData} />}
              {stream === 'homeopathy' && <HomeopathyForm data={streamData} onChange={setStreamData} />}
              {stream === 'unani' && <UnaniForm data={streamData} onChange={setStreamData} />}
              {stream === 'siddha' && <SiddhaForm data={streamData} onChange={setStreamData} />}
            </div>

            {/* Follow-up Linking */}
            {previousCases.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('link_previous')}</label>
                <select
                  value={followUpOf || ''}
                  onChange={(e) => setFollowUpOf(e.target.value || null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                >
                  <option value="">{t('no_previous')}</option>
                  {previousCases.map(c => (
                    <option key={c.id} value={c.id}>
                      {new Date(c.created_at).toLocaleDateString('en-IN')} - {c.diagnosis || 'No diagnosis'} ({c.stream})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Diagnosis & Treatment */}
            <div className="mt-6 pt-6 border-t border-gray-200 space-y-4">
              <h4 className="font-medium text-gray-900">Diagnosis &amp; Treatment</h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('diagnosis')}</label>
                <DiagnosisAutocomplete
                  value={diagnosis}
                  onChange={setDiagnosis}
                  onCodeSelect={(nc, ic) => { setNamasteCode(nc); setIcd11Code(ic) }}
                  stream={stream}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('namaste_code')}</label>
                  <input type="text" value={namasteCode} onChange={(e) => setNamasteCode(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none" placeholder="NAMASTE code" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('icd11_code')}</label>
                  <input type="text" value={icd11Code} onChange={(e) => setIcd11Code(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none" placeholder="ICD-11 code" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('treatment_plan')}</label>
                <textarea value={treatmentPlan} onChange={(e) => setTreatmentPlan(e.target.value)} rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none" placeholder={t('treatment_plan_placeholder')} />
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => handleStreamChange(null)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">{t('back')}</button>
            <button onClick={handleSubmit} disabled={loading || !commonData.chief_complaints} className="flex-1 bg-emerald-600 text-white py-3 rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors text-lg">
              {loading ? 'Saving...' : t('save_case')}</button>
          </div>
          {error && <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm">{error}</div>}
        </>
      )}
    </div>
  )
}

function StreamSelector({ onSelect }: { onSelect: (s: Stream) => void }) {
  const { t } = useTranslation()
  const opts = [
    { id: 'ayurveda' as const, label: 'Ayurveda', emoji: '🌿' },
    { id: 'homeopathy' as const, label: 'Homeopathy', emoji: '💧' },
    { id: 'unani' as const, label: 'Unani', emoji: '🔥' },
    { id: 'siddha' as const, label: 'Siddha', emoji: '❤️' },
  ]
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="font-semibold text-gray-900 mb-4">{t('select_stream')}</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {opts.map((o) => (
          <button key={o.id} onClick={() => onSelect(o.id)} className="p-6 rounded-xl border-2 border-gray-200 hover:border-emerald-400 hover:bg-emerald-50 transition-all text-center">
            <div className="text-3xl mb-2">{o.emoji}</div>
            <div className="font-medium text-gray-900">{o.label}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
