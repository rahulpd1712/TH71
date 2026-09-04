interface PersonalHistory {
  diet: string
  sleep: string
  bowel: string
  bladder: string
  addictions: string
}

interface Vitals {
  pulse: string
  bp: string
  temp: string
  weight: string
  height: string
}

interface CommonData {
  chief_complaints: string
  history_present_illness: string
  past_history: string
  family_history: string
  personal_history: PersonalHistory
  vitals: Vitals
}

interface Props {
  data: CommonData
  onChange: (data: CommonData) => void
}

function Input({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
        placeholder={placeholder}
      />
    </div>
  )
}

function Textarea({ label, value, onChange, placeholder, rows = 3 }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-y"
        placeholder={placeholder}
      />
    </div>
  )
}

export default function CommonCaseFields({ data, onChange }: Props) {
  function updateCommon(field: keyof Omit<CommonData, 'personal_history' | 'vitals'>, value: string) {
    onChange({ ...data, [field]: value })
  }

  function updatePersonal(field: keyof PersonalHistory, value: string) {
    onChange({ ...data, personal_history: { ...data.personal_history, [field]: value } })
  }

  function updateVitals(field: keyof Vitals, value: string) {
    onChange({ ...data, vitals: { ...data.vitals, [field]: value } })
  }

  return (
    <div className="space-y-6">
      {/* Chief Complaints with mic */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Chief Complaints *</label>
        <div className="flex gap-2">
          <textarea
            value={data.chief_complaints}
            onChange={(e) => updateCommon('chief_complaints', e.target.value)}
            rows={2}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-y"
            placeholder="Chief complaints with duration..."
          />
          <VoiceButton
            onResult={(text) => updateCommon('chief_complaints', data.chief_complaints + ' ' + text)}
          />
        </div>
      </div>

      <Textarea
        label="History of Present Illness"
        value={data.history_present_illness}
        onChange={(v) => updateCommon('history_present_illness', v)}
        placeholder="Detailed history of present illness..."
        rows={3}
      />

      <Textarea
        label="Past History"
        value={data.past_history}
        onChange={(v) => updateCommon('past_history', v)}
        placeholder="Past medical/surgical history..."
        rows={2}
      />

      <Textarea
        label="Family History"
        value={data.family_history}
        onChange={(v) => updateCommon('family_history', v)}
        placeholder="Family medical history..."
        rows={2}
      />

      {/* Personal History */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Personal History</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Input label="Diet" value={data.personal_history.diet} onChange={(v) => updatePersonal('diet', v)} placeholder="Veg/Non-veg" />
          <Input label="Sleep" value={data.personal_history.sleep} onChange={(v) => updatePersonal('sleep', v)} placeholder="Hours, quality" />
          <Input label="Bowel" value={data.personal_history.bowel} onChange={(v) => updatePersonal('bowel', v)} placeholder="Regularity" />
          <Input label="Bladder" value={data.personal_history.bladder} onChange={(v) => updatePersonal('bladder', v)} placeholder="Frequency" />
          <Input label="Addictions" value={data.personal_history.addictions} onChange={(v) => updatePersonal('addictions', v)} placeholder="Tobacco, alcohol..." />
        </div>
      </div>

      {/* Vitals */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Vitals</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Input label="Pulse" value={data.vitals.pulse} onChange={(v) => updateVitals('pulse', v)} placeholder="bpm" />
          <Input label="BP" value={data.vitals.bp} onChange={(v) => updateVitals('bp', v)} placeholder="120/80 mmHg" />
          <Input label="Temp" value={data.vitals.temp} onChange={(v) => updateVitals('temp', v)} placeholder="°F" />
          <Input label="Weight" value={data.vitals.weight} onChange={(v) => updateVitals('weight', v)} placeholder="kg" />
          <Input label="Height" value={data.vitals.height} onChange={(v) => updateVitals('height', v)} placeholder="cm" />
        </div>
      </div>
    </div>
  )
}

// Voice button component using Web Speech API
function VoiceButton({ onResult }: { onResult: (text: string) => void }) {
  function startListening() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Chrome.')
      return
    }
    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-IN'
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      onResult(transcript)
    }
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error)
    }
    recognition.start()
  }

  return (
    <button
      type="button"
      onClick={startListening}
      className="self-start mt-1 px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
      title="Voice input"
    >
      🎤
    </button>
  )
}
