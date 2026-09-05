import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { apiClient } from '../lib/apiClient'
import { generateCasePDF } from '../lib/pdfGenerator'
import { ArrowLeft, Plus, Eye, Download, FileText } from 'lucide-react'

interface Patient {
  id: string
  name: string
  age: number
  gender: string
  contact: string | null
  abha_id: string | null
}

interface CaseRow {
  id: string
  stream: string
  chief_complaints: string | null
  diagnosis: string | null
  treatment_plan: string | null
  created_at: string
  patients?: { name: string; age: number; gender: string; contact: string | null; abha_id: string | null }
  users?: { full_name: string | null }
  [key: string]: unknown
}

export default function PatientHistory() {
  const { patientId } = useParams()
  const navigate = useNavigate()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [cases, setCases] = useState<CaseRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (patientId) {
      Promise.all([
        apiClient.from('patients').select('*').eq('id', patientId).single(),
        apiClient.from('cases').select('*, users(full_name)').eq('patient_id', patientId).order('created_at', { ascending: false }),
      ]).then(([patientRes, casesRes]) => {
        setPatient(patientRes.data)
        setCases(casesRes.data || [])
        setLoading(false)
      })
    }
  }, [patientId])

  function handleDownloadPDF(c: CaseRow) {
    if (!patient) return
    const doc = generateCasePDF(
      { name: patient.name, age: patient.age, gender: patient.gender, contact: patient.contact, abha_id: patient.abha_id },
      { stream: c.stream, chief_complaints: c.chief_complaints, history_present_illness: c.history_present_illness as any, past_history: c.past_history as any, family_history: c.family_history as any, personal_history: c.personal_history as any, vitals: c.vitals as any, stream_specific_data: c.stream_specific_data as any, diagnosis: c.diagnosis, treatment_plan: c.treatment_plan as any, namaste_code: c.namaste_code as any, icd11_tm2_code: c.icd11_tm2_code as any, created_at: c.created_at, doctor_name: (c.users as any)?.full_name }
    )
    doc.save(`case-sheet-${c.id}.pdf`)
  }

  const streamColors: Record<string, string> = {
    ayurveda: 'bg-emerald-100 text-emerald-700',
    homeopathy: 'bg-blue-100 text-blue-700',
    unani: 'bg-orange-100 text-orange-700',
    siddha: 'bg-rose-100 text-rose-700',
  }

  if (loading) return <div className="text-center py-12 text-gray-500">Loading...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{patient?.name}</h2>
            <p className="text-sm text-gray-500">
              {patient?.age} years, {patient?.gender} | {cases.length} case{cases.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate(`/cases/new?patient_id=${patientId}`)}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> New Case
        </button>
      </div>

      {cases.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No cases yet for this patient</p>
          <button
            onClick={() => navigate(`/cases/new?patient_id=${patientId}`)}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700"
          >
            Start First Case
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {cases.map((c) => (
            <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${streamColors[c.stream] || ''}`}>
                      {c.stream}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  {c.chief_complaints && (
                    <p className="text-sm text-gray-700 line-clamp-2">{c.chief_complaints}</p>
                  )}
                  {c.diagnosis && (
                    <p className="text-sm font-medium text-gray-900">Diagnosis: {c.diagnosis}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => navigate(`/cases/${c.id}`)}
                    className="text-emerald-600 hover:text-emerald-700 p-2 rounded-lg hover:bg-emerald-50"
                    title="View case"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDownloadPDF(c)}
                    className="text-blue-600 hover:text-blue-700 p-2 rounded-lg hover:bg-blue-50"
                    title="Download PDF"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
