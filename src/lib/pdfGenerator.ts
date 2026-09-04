import jsPDF from 'jspdf'

interface Patient {
  name: string
  age: number
  gender: string
  contact: string | null
  abha_id: string | null
}

interface CaseData {
  stream: string
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
  doctor_name?: string
}

export function generateCasePDF(patient: Patient, caseData: CaseData, prevCases?: Array<{id: string; stream: string; diagnosis: string | null; treatment_plan: string | null; created_at: string; doctor_name?: string}>) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  let y = 20

  // Header
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('AYUSH CASE FILE', pageWidth / 2, y, { align: 'center' })
  y += 8

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Stream: ${caseData.stream.toUpperCase()}`, pageWidth / 2, y, { align: 'center' })
  y += 6
  doc.text(`Date: ${new Date(caseData.created_at).toLocaleDateString('en-IN')}`, pageWidth / 2, y, { align: 'center' })
  y += 10

  // Divider line
  doc.setDrawColor(0, 128, 0)
  doc.setLineWidth(0.5)
  doc.line(margin, y, pageWidth - margin, y)
  y += 10

  // Patient Info
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('PATIENT INFORMATION', margin, y)
  y += 7

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  const patientInfo = [
    `Name: ${patient.name}`,
    `Age: ${patient.age} years`,
    `Gender: ${patient.gender}`,
    `Contact: ${patient.contact || 'N/A'}`,
    `ABHA ID: ${patient.abha_id || 'N/A'}`,
  ]
  if (caseData.doctor_name) patientInfo.push(`Doctor: ${caseData.doctor_name}`)

  patientInfo.forEach(line => {
    doc.text(line, margin, y)
    y += 5.5
  })
  y += 5

  // Section helper
  function addSection(title: string, content: string[]) {
    if (y > 260) {
      doc.addPage()
      y = 20
    }
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text(title, margin, y)
    y += 6
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    content.forEach(line => {
      if (y > 270) {
        doc.addPage()
        y = 20
      }
      const splitText = doc.splitTextToSize(line, pageWidth - 2 * margin)
      splitText.forEach((textLine: string) => {
        doc.text(textLine, margin, y)
        y += 5
      })
      y += 1
    })
    y += 3
  }

  // Chief Complaints
  if (caseData.chief_complaints) {
    addSection('CHIEF COMPLAINTS', [caseData.chief_complaints])
  }

  // History
  if (caseData.history_present_illness) {
    addSection('PRESENT ILLNESS', [caseData.history_present_illness])
  }
  if (caseData.past_history) {
    addSection('PAST HISTORY', [caseData.past_history])
  }
  if (caseData.family_history) {
    addSection('FAMILY HISTORY', [caseData.family_history])
  }

  // Personal History
  if (caseData.personal_history) {
    const ph = caseData.personal_history
    const lines = Object.entries(ph)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k.charAt(0).toUpperCase() + k.slice(1)}: ${v}`)
    if (lines.length) addSection('PERSONAL HISTORY', lines)
  }

  // Vitals
  if (caseData.vitals) {
    const vt = caseData.vitals
    const lines = Object.entries(vt)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k.toUpperCase()}: ${v}`)
    if (lines.length) addSection('VITALS', lines)
  }

  // Stream-specific data
  if (caseData.stream_specific_data) {
    const ss = caseData.stream_specific_data
    Object.entries(ss).forEach(([key, value]) => {
      if (value && typeof value === 'object') {
        const entries = Object.entries(value as Record<string, unknown>)
          .filter(([, v]) => v)
          .map(([k, v]) => `${k.replace(/_/g, ' ').toUpperCase()}: ${v}`)
        if (entries.length) {
          addSection(key.replace(/_/g, ' ').toUpperCase(), entries)
        }
      } else if (value && typeof value === 'string') {
        addSection(key.replace(/_/g, ' ').toUpperCase(), [value])
      }
    })
  }

  // Diagnosis
  if (caseData.diagnosis) {
    addSection('DIAGNOSIS', [caseData.diagnosis])
  }

  // NAMASTE/ICD-11
  const codes: string[] = []
  if (caseData.namaste_code) codes.push(`NAMASTE Code: ${caseData.namaste_code}`)
  if (caseData.icd11_tm2_code) codes.push(`ICD-11 TM2 Code: ${caseData.icd11_tm2_code}`)
  if (codes.length) addSection('CODING', codes)

  // Treatment
  if (caseData.treatment_plan) {
    addSection('TREATMENT PLAN', [caseData.treatment_plan])
  }

  // Previous Cases
  if (prevCases && prevCases.length > 0) {
    const prevLines = prevCases.map(pc => {
      const date = new Date(pc.created_at).toLocaleDateString('en-IN')
      const doc = pc.doctor_name ? ' (Dr. ' + pc.doctor_name + ')' : ''
      return date + doc + ' | ' + pc.stream + (pc.diagnosis ? ' | ' + pc.diagnosis : '') + (pc.treatment_plan ? ' | ' + pc.treatment_plan : '')
    })
    addSection('PREVIOUS MEDICAL HISTORY (' + prevCases.length + ' cases)', prevLines)
  }

  // Footer
  y = doc.internal.pageSize.getHeight() - 15
  doc.setFontSize(8)
  doc.setTextColor(128, 128, 128)
  doc.text('Generated by Ayush Case-Taking Software', margin, y)
  doc.text(`Page ${doc.getNumberOfPages()}`, pageWidth - margin, y, { align: 'right' })

  return doc
}
