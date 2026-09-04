export interface NamasteMapping {
  diagnosis: string
  namaste_code: string
  icd11_tm2_code: string
  stream: string
}

export const namasteCodes: NamasteMapping[] = [
  // Ayurveda
  { diagnosis: 'Jwara', namaste_code: 'JW-01', icd11_tm2_code: 'XM1CZ1', stream: 'ayurveda' },
  { diagnosis: 'Kasa', namaste_code: 'KA-02', icd11_tm2_code: 'XM2BF7', stream: 'ayurveda' },
  { diagnosis: 'Shwasa', namaste_code: 'SH-03', icd11_tm2_code: 'XM2BF2', stream: 'ayurveda' },
  { diagnosis: 'Atisara', namaste_code: 'AT-04', icd11_tm2_code: 'XM4001', stream: 'ayurveda' },
  { diagnosis: 'Prameha', namaste_code: 'PR-05', icd11_tm2_code: 'XM1BA0', stream: 'ayurveda' },
  { diagnosis: 'Amavata', namaste_code: 'AM-06', icd11_tm2_code: 'XM00A1', stream: 'ayurveda' },
  { diagnosis: 'Sandhivata', namaste_code: 'SD-07', icd11_tm2_code: 'XM00B0', stream: 'ayurveda' },
  { diagnosis: 'Hridroga', namaste_code: 'HR-08', icd11_tm2_code: 'XM2A01', stream: 'ayurveda' },
  { diagnosis: 'Yakritvikara', namaste_code: 'YK-09', icd11_tm2_code: 'XM1310', stream: 'ayurveda' },
  { diagnosis: 'Tamaka Shwasa', namaste_code: 'TS-10', icd11_tm2_code: 'XM2BF2', stream: 'ayurveda' },
  { diagnosis: 'Raktapitta', namaste_code: 'RP-11', icd11_tm2_code: 'XM1A20', stream: 'ayurveda' },
  { diagnosis: 'Grahaṇi', namaste_code: 'GR-12', icd11_tm2_code: 'XM4002', stream: 'ayurveda' },
  { diagnosis: 'Udara', namaste_code: 'UD-13', icd11_tm2_code: 'XM1410', stream: 'ayurveda' },
  { diagnosis: 'Kushtha', namaste_code: 'KS-14', icd11_tm2_code: 'XM1410', stream: 'ayurveda' },
  { diagnosis: 'Unmada', namaste_code: 'UM-15', icd11_tm2_code: 'XM6C10', stream: 'ayurveda' },
  { diagnosis: 'Apasmara', namaste_code: 'AP-16', icd11_tm2_code: 'XM6A10', stream: 'ayurveda' },
  { diagnosis: 'Pandu', namaste_code: 'PA-17', icd11_tm2_code: 'XM1B20', stream: 'ayurveda' },
  { diagnosis: 'Kamala', namaste_code: 'KM-18', icd11_tm2_code: 'XM1310', stream: 'ayurveda' },
  { diagnosis: 'Mutrashmari', namaste_code: 'MU-19', icd11_tm2_code: 'XM1601', stream: 'ayurveda' },
  { diagnosis: 'Vatarakta', namaste_code: 'VT-20', icd11_tm2_code: 'XM1201', stream: 'ayurveda' },
  // Homeopathy
  { diagnosis: 'Asthma', namaste_code: 'HA-01', icd11_tm2_code: 'XM2BF2', stream: 'homeopathy' },
  { diagnosis: 'Eczema', namaste_code: 'HE-02', icd11_tm2_code: 'XM1410', stream: 'homeopathy' },
  { diagnosis: 'Migraine', namaste_code: 'HM-03', icd11_tm2_code: 'XM1101', stream: 'homeopathy' },
  { diagnosis: 'Bronchitis', namaste_code: 'HB-04', icd11_tm2_code: 'XM2BF7', stream: 'homeopathy' },
  { diagnosis: 'Arthritis', namaste_code: 'HA-05', icd11_tm2_code: 'XM00A1', stream: 'homeopathy' },
  { diagnosis: 'Sinusitis', namaste_code: 'HS-06', icd11_tm2_code: 'XM2101', stream: 'homeopathy' },
  { diagnosis: 'Colitis', namaste_code: 'HC-07', icd11_tm2_code: 'XM4002', stream: 'homeopathy' },
  { diagnosis: 'Insomnia', namaste_code: 'HI-08', icd11_tm2_code: 'XM6B00', stream: 'homeopathy' },
  { diagnosis: 'Allergic Rhinitis', namaste_code: 'HA-09', icd11_tm2_code: 'XM2100', stream: 'homeopathy' },
  { diagnosis: 'Vertigo', namaste_code: 'HV-10', icd11_tm2_code: 'XM6A10', stream: 'homeopathy' },
  { diagnosis: 'Urticaria', namaste_code: 'HU-11', icd11_tm2_code: 'XM1410', stream: 'homeopathy' },
  { diagnosis: 'Psoriasis', namaste_code: 'HP-12', icd11_tm2_code: 'XM1410', stream: 'homeopathy' },
  { diagnosis: 'Tonsillitis', namaste_code: 'HT-13', icd11_tm2_code: 'XM2101', stream: 'homeopathy' },
  { diagnosis: 'Peptic Ulcer', namaste_code: 'HPU-14', icd11_tm2_code: 'XM4001', stream: 'homeopathy' },
  { diagnosis: 'Depression', namaste_code: 'HD-15', icd11_tm2_code: 'XM6210', stream: 'homeopathy' },
  { diagnosis: 'Anxiety', namaste_code: 'HA-16', icd11_tm2_code: 'XM6010', stream: 'homeopathy' },
  { diagnosis: 'Rheumatism', namaste_code: 'HR-17', icd11_tm2_code: 'XM00A1', stream: 'homeopathy' },
  { diagnosis: 'Conjunctivitis', namaste_code: 'HC-18', icd11_tm2_code: 'XM1001', stream: 'homeopathy' },
  { diagnosis: 'Hypothyroidism', namaste_code: 'HH-19', icd11_tm2_code: 'XM1C01', stream: 'homeopathy' },
  { diagnosis: 'PCOD', namaste_code: 'HP-20', icd11_tm2_code: 'XM1E10', stream: 'homeopathy' },
  // Unani
  { diagnosis: 'Daa-ul-Batn', namaste_code: 'DU-01', icd11_tm2_code: 'XM4001', stream: 'unani' },
  { diagnosis: 'Suda', namaste_code: 'SU-02', icd11_tm2_code: 'XM1101', stream: 'unani' },
  { diagnosis: 'Qulai', namaste_code: 'QU-03', icd11_tm2_code: 'XM2BF7', stream: 'unani' },
  { diagnosis: 'Humma-e-Wabai', namaste_code: 'HW-04', icd11_tm2_code: 'XM0101', stream: 'unani' },
  { diagnosis: 'Raqqa', namaste_code: 'RQ-05', icd11_tm2_code: 'XM4002', stream: 'unani' },
  { diagnosis: 'Samta Fil Ayn', namaste_code: 'SA-06', icd11_tm2_code: 'XM1001', stream: 'unani' },
  { diagnosis: 'Waja-ul-Mufasil', namaste_code: 'WM-07', icd11_tm2_code: 'XM00A1', stream: 'unani' },
  { diagnosis: 'Saratan', namaste_code: 'SR-08', icd11_tm2_code: 'XM2A00', stream: 'unani' },
  { diagnosis: 'Jild', namaste_code: 'JD-09', icd11_tm2_code: 'XM1410', stream: 'unani' },
  { diagnosis: 'Bawaseer', namaste_code: 'BW-10', icd11_tm2_code: 'XM4201', stream: 'unani' },
  // Siddha
  { diagnosis: 'Pei', namaste_code: 'SP-01', icd11_tm2_code: 'XM2BF2', stream: 'siddha' },
  { diagnosis: 'Aanmai', namaste_code: 'SA-02', icd11_tm2_code: 'XM00A1', stream: 'siddha' },
  { diagnosis: 'Migai', namaste_code: 'SM-03', icd11_tm2_code: 'XM1101', stream: 'siddha' },
  { diagnosis: 'Noi Kalanthu', namaste_code: 'SN-04', icd11_tm2_code: 'XM1410', stream: 'siddha' },
  { diagnosis: 'Irumai', namaste_code: 'SI-05', icd11_tm2_code: 'XM4002', stream: 'siddha' },
]

export function searchNamaste(query: string): NamasteMapping[] {
  if (!query || query.length < 2) return []
  const lower = query.toLowerCase()
  return namasteCodes.filter(
    n => n.diagnosis.toLowerCase().includes(lower)
  )
}
