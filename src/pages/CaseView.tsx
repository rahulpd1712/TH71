import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { apiClient } from '../lib/apiClient'
import { generateCasePDF } from '../lib/pdfGenerator'
import { ArrowLeft, Download, CheckCircle, Circle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'

interface CaseRecord {
  id: string
  patient_id: string
  doctor_id: string
  stream: string
  status: string | null
  chief_complaints: string | null
  history_present_illness: string | null
  past_history: string | null
  family_history: string | null
  personal_history: Record<string, string> | null
  vitals: Record<string, string> | null
  stream_specific_data: Record<string, unknown> | null
  diagnosis: string | null
  treatment_plan: string | null
  namaste_code: string | null
  icd11_tm2_code: string | null
  created_at: string
  patient_name?: string
  patient_age?: number
  patient_gender?: string
  patient_contact?: string | null
  patient_abha?: string | null
  doctor_name?: string
  admin_name?: string
}

interface PrevCase {
  id: string
  stream: string
  diagnosis: string | null
  treatment_plan: string | null
  created_at: string
  doctor_name?: string
}

export default function CaseView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [caseRecord, setCaseRecord] = useState<CaseRecord | null>(null)
  const [prevCases, setPrevCases] = useState<PrevCase[]>([])
  const [loading, setLoading] = useState(true)
  const { t } = useTranslation()
  const { profile } = useAuth()
  const isDoctor = profile?.role === 'doctor' || profile?.role === 'assistant'
  const isAdmin = profile?.role === 'super_admin' || profile?.role === 'hospital' || profile?.role === 'admin'

  useEffect(() => {
    if (id) {
      apiClient.from('cases').select('*').eq('id', id).single().then(({ data }: any) => {
        setCaseRecord(data)
        setLoading(false)
        // Load previous cases for this patient (doctors only)
        if (isDoctor && data?.patient_id) {
          apiClient.from('cases').select('*').eq('patient_id', data.patient_id).order('created_at', { ascending: false }).then(({ data: prev }: any) => {
            setPrevCases((prev || []).filter((c: any) => c.id !== id))
          })
        }
      })
    }
  }, [id, isDoctor])

  async function handleDownloadPDF() {
    if (!caseRecord) return
    const doc = generateCasePDF(
      { name: caseRecord.patient_name || '', age: caseRecord.patient_age || 0, gender: caseRecord.patient_gender || '', contact: caseRecord.patient_contact || null, abha_id: caseRecord.patient_abha || null },
      { ...caseRecord, doctor_name: caseRecord.doctor_name || undefined },
      isDoctor ? prevCases : undefined
    )
    doc.save(`case-file-${caseRecord.id}.pdf`)
  }

  async function toggleStatus() {
    if (!caseRecord) return
    const newStatus = (caseRecord.status || 'ongoing') === 'closed' ? 'ongoing' : 'closed'
    await apiClient.from('cases').update({ status: newStatus }).eq('id', caseRecord.id)
    setCaseRecord({ ...caseRecord, status: newStatus })
  }

  if (loading) return <div className="text-center py-12 text-gray-500">{t("loading")}...</div>
  if (!caseRecord) return <div className="text-center py-12 text-gray-500">{t("no_cases")}</div>

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="flex items-center gap-3">
          {isDoctor && (
            <button onClick={toggleStatus} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${(caseRecord.status || 'ongoing') === 'closed' ? 'bg-gray-600 text-white hover:bg-gray-700' : 'bg-green-600 text-white hover:bg-green-700'}`}>
              {(caseRecord.status || 'ongoing') === 'closed' ? <CheckCircle className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
              {(caseRecord.status || 'ongoing') === 'closed' ? 'Mark Ongoing' : 'Mark Closed'}
            </button>
          )}
          {!isAdmin && (
            <button onClick={handleDownloadPDF} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700">
              <Download className="h-4 w-4" /> {t("download_pdf")}
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-8 space-y-6">
        <div className="text-center border-b border-gray-200 pb-4">
          <h2 className="text-2xl font-bold text-gray-900">{t("app_name")} Case File</h2>
          <p className="text-sm text-gray-500 capitalize">{caseRecord.stream} | {new Date(caseRecord.created_at).toLocaleDateString('en-IN')}</p>
          <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${(caseRecord.status || 'ongoing') === 'closed' ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'}`}>
            {(caseRecord.status || 'ongoing') === 'closed' ? 'Closed' : 'Ongoing'}
          </span>
        </div>

        {!isAdmin && (
          <Section title="Patient Information">
            <InfoRow label="Name" value={caseRecord.patient_name} />
            <InfoRow label="Age" value={caseRecord.patient_age ? `${caseRecord.patient_age} years` : undefined} />
            <InfoRow label="Gender" value={caseRecord.patient_gender} />
            <InfoRow label="Contact" value={caseRecord.patient_contact || 'N/A'} />
            <InfoRow label="ABHA ID" value={caseRecord.patient_abha || 'N/A'} />
            {caseRecord.doctor_name && <InfoRow label="Doctor" value={caseRecord.doctor_name} />}
          </Section>
        )}

        {caseRecord.chief_complaints && (
          <Section title="Chief Complaints">
            <p className="text-gray-700">{caseRecord.chief_complaints}</p>
          </Section>
        )}

        {caseRecord.history_present_illness && (
          <Section title="Present Illness">
            <p className="text-gray-700 whitespace-pre-wrap">{caseRecord.history_present_illness}</p>
          </Section>
        )}

        {caseRecord.past_history && (
          <Section title="Past History">
            <p className="text-gray-700 whitespace-pre-wrap">{caseRecord.past_history}</p>
          </Section>
        )}

        {caseRecord.family_history && (
          <Section title="Family History">
            <p className="text-gray-700 whitespace-pre-wrap">{caseRecord.family_history}</p>
          </Section>
        )}

        {caseRecord.personal_history && Object.values(caseRecord.personal_history).some(v => v) && (
          <Section title="Personal History">
            {Object.entries(caseRecord.personal_history).filter(([, v]) => v).map(([k, v]) => (
              <InfoRow key={k} label={k.charAt(0).toUpperCase() + k.slice(1)} value={v} />
            ))}
          </Section>
        )}

        {caseRecord.vitals && Object.values(caseRecord.vitals).some(v => v) && (
          <Section title="Vitals">
            {Object.entries(caseRecord.vitals).filter(([, v]) => v).map(([k, v]) => (
              <InfoRow key={k} label={k.toUpperCase()} value={v} />
            ))}
          </Section>
        )}

        {caseRecord.stream_specific_data && <StreamSpecificView data={caseRecord.stream_specific_data} />}

        {!isAdmin && caseRecord.diagnosis && (
          <Section title="Diagnosis">
            <p className="text-gray-700 font-medium">{caseRecord.diagnosis}</p>
          </Section>
        )}

        {(caseRecord.namaste_code || caseRecord.icd11_tm2_code) && (
          <Section title="Coding">
            {caseRecord.namaste_code && <InfoRow label="NAMASTE" value={caseRecord.namaste_code} />}
            {caseRecord.icd11_tm2_code && <InfoRow label="ICD-11 TM2" value={caseRecord.icd11_tm2_code} />}
          </Section>
        )}

        {caseRecord.treatment_plan && (
          <Section title="Treatment Plan">
            <p className="text-gray-700 whitespace-pre-wrap">{caseRecord.treatment_plan}</p>
          </Section>
        )}

        {/* Previous Cases - Doctors only */}
        {isDoctor && prevCases.length > 0 && (
          <Section title={`Previous Cases (${prevCases.length})`}>
            {prevCases.map(pc => (
              <div key={pc.id} className="bg-white rounded-lg p-3 border border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">{pc.stream} - {new Date(pc.created_at).toLocaleDateString('en-IN')}</span>
                  {pc.doctor_name && <span className="text-xs text-gray-500">Dr. {pc.doctor_name}</span>}
                </div>
                {pc.diagnosis && <p className="text-sm text-gray-600 mt-1">Diagnosis: {pc.diagnosis}</p>}
                {pc.treatment_plan && <p className="text-xs text-gray-500 mt-1">Treatment: {pc.treatment_plan}</p>}
              </div>
            ))}
          </Section>
        )}
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
      <div className="bg-gray-50 rounded-lg p-4 space-y-2">{children}</div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex gap-2">
      <span className="text-sm text-gray-500 min-w-[120px]">{label}:</span>
      <span className="text-sm text-gray-700">{value || '—'}</span>
    </div>
  )
}

function StreamSpecificView({ data }: { data: Record<string, unknown> }) {
  return (
    <>
      {Object.entries(data).map(([key, value]) => {
        if (!value) return null
        if (typeof value === 'object' && value !== null) {
          const entries = Object.entries(value as Record<string, unknown>).filter(([, v]) => v)
          if (entries.length === 0) return null
          return (
            <Section key={key} title={key.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}>
              {entries.map(([k, v]) => (
                <InfoRow key={k} label={k.replace(/_/g, ' ')} value={String(v)} />
              ))}
            </Section>
          )
        }
        return (
          <Section key={key} title={key.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}>
            <p className="text-gray-700">{String(value)}</p>
          </Section>
        )
      })}
    </>
  )
}
