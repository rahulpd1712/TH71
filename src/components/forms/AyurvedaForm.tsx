
interface Props {
  data: Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
}

const PRKRITI_OPTIONS = {
  body_frame: ['Thin/Light', 'Medium', 'Heavy/Stocky'],
  skin_type: ['Dry/Rough', 'Warm/Oily', 'Cool/Thick/Oily'],
  appetite: ['Variable/Quick', 'Strong/Sharp', 'Slow/Steady'],
  temperament: ['Active/Restless', 'Focused/Intense', 'Calm/Relaxed'],
  digestion: ['Irregular', 'Strong/Sharp', 'Slow/Heavy'],
  speech: ['Fast/Rapid', 'Sharp/Loud', 'Slow/Deliberate'],
}

const DOSHA_OPTIONS = ['Vata', 'Pitta', 'Kapha']
const DOSHA_PARIKSHA_OPTIONS = ['Normal', 'Increased', 'Decreased']

export default function AyurvedaForm({ data, onChange }: Props) {
  const prakriti = (data.prakriti_assessment as Record<string, string>) || {}
  const dashavidha = (data.dashavidha_pariksha as Record<string, string>) || {}
  const ashtavidha = (data.ashtavidha_pariksha as Record<string, string>) || {}

  // Rule-based dosha scoring
  const doshaScores = { vata: 0, pitta: 0, kapha: 0 }
  Object.entries(prakriti).forEach(([, value]) => {
    if (value === PRKRITI_OPTIONS.body_frame[0] || value === PRKRITI_OPTIONS.appetite[0] || 
        value === PRKRITI_OPTIONS.temperament[0] || value === PRKRITI_OPTIONS.digestion[0] ||
        value === PRKRITI_OPTIONS.speech[0] || value === PRKRITI_OPTIONS.skin_type[0]) {
      doshaScores.vata++
    } else if (value === PRKRITI_OPTIONS.body_frame[2] || value === PRKRITI_OPTIONS.appetite[2] ||
               value === PRKRITI_OPTIONS.temperament[2] || value === PRKRITI_OPTIONS.digestion[2] ||
               value === PRKRITI_OPTIONS.speech[2] || value === PRKRITI_OPTIONS.skin_type[2]) {
      doshaScores.kapha++
    } else if (value) {
      doshaScores.pitta++
    }
  })

  const dominantDosha = doshaScores.vata >= doshaScores.pitta && doshaScores.vata >= doshaScores.kapha ? 'Vata'
    : doshaScores.pitta >= doshaScores.kapha ? 'Pitta' : 'Kapha'

  function update(field: string, value: unknown) {
    onChange({ ...data, [field]: value })
  }

  return (
    <div className="space-y-6">
      {/* AI Dosha Suggestion Badge */}
      {Object.values(prakriti).some(v => v) && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2">
          <span className="text-amber-600 font-medium">✨ AI Dosha Suggestion:</span>
          <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-semibold">
            {dominantDosha} ({doshaScores.vata}V / {doshaScores.pitta}P / {doshaScores.kapha}K)
          </span>
        </div>
      )}

      {/* Prakriti Assessment */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Prakriti Assessment</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(PRKRITI_OPTIONS).map(([field, options]) => (
            <div key={field}>
              <label className="block text-xs font-medium text-gray-600 mb-1 capitalize">
                {field.replace(/_/g, ' ')}
              </label>
              <select
                value={prakriti[field] || ''}
                onChange={(e) => update('prakriti_assessment', { ...prakriti, [field]: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="">Select</option>
                {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Dashavidha Pariksha */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Dashavidha Pariksha</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {['dosha', 'dushya', 'desha', 'kala', 'bala', 'agni'].map(field => (
            <div key={field}>
              <label className="block text-xs font-medium text-gray-600 mb-1 capitalize">
                {field}
              </label>
              <select
                value={dashavidha[field] || ''}
                onChange={(e) => update('dashavidha_pariksha', { ...dashavidha, [field]: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="">Select</option>
                {DOSHA_PARIKSHA_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Ashtavidha Pariksha */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Ashtavidha Pariksha</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['nadi', 'mutra', 'mala', 'jihva', 'shabda', 'sparsha', 'druk', 'akriti'].map(field => (
            <div key={field}>
              <label className="block text-xs font-medium text-gray-600 mb-1 capitalize">{field}</label>
              <select
                value={ashtavidha[field] || ''}
                onChange={(e) => update('ashtavidha_pariksha', { ...ashtavidha, [field]: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="">Select</option>
                {DOSHA_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
