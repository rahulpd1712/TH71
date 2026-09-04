export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          role: 'doctor' | 'assistant' | 'admin' | 'hospital' | 'super_admin'
          full_name: string | null
          approved: boolean
          requested_at: string | null
          created_at: string
        }
        Insert: {
          id: string
          role: 'doctor' | 'assistant' | 'admin' | 'hospital' | 'super_admin'
          full_name?: string | null
          approved?: boolean
          requested_at?: string | null
          created_at?: string
        }
      }
      patients: {
        Row: {
          id: string
          name: string
          age: number
          gender: string
          contact: string | null
          abha_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          age: number
          gender: string
          contact?: string | null
          abha_id?: string | null
          created_at?: string
        }
      }
      cases: {
        Row: {
          id: string
          patient_id: string
          doctor_id: string
          stream: string
          chief_complaints: string | null
          history_present_illness: string | null
          past_history: string | null
          family_history: string | null
          personal_history: Record<string, unknown> | null
          vitals: Record<string, unknown> | null
          stream_specific_data: Record<string, unknown> | null
          diagnosis: string | null
          namaste_code: string | null
          icd11_tm2_code: string | null
          treatment_plan: string | null
          follow_up_of: string | null
          created_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          doctor_id: string
          stream: string
          chief_complaints?: string | null
          history_present_illness?: string | null
          past_history?: string | null
          family_history?: string | null
          personal_history?: Record<string, unknown> | null
          vitals?: Record<string, unknown> | null
          stream_specific_data?: Record<string, unknown> | null
          diagnosis?: string | null
          namaste_code?: string | null
          icd11_tm2_code?: string | null
          treatment_plan?: string | null
          follow_up_of?: string | null
          created_at?: string
        }
      }
    }
  }
}
