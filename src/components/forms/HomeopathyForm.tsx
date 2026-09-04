interface Props {
  data: Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
}

const MIASM_OPTIONS = ['Psoric', 'Sycotic', 'Syphilitic', 'Tubercular', 'Psoro-Sycotic']

export default function HomeopathyForm({ data, onChange }: Props) {
  const totality = (data.totality_of_symptoms as Record<string, string>) || {}
  const modalities = (data.modalities as Record<string, string>) || {}

  function update(field: string, value: unknown) {
    onChange({ ...data, [field]: value })
  }

  return (
    <div className="space-y-6">
      {/* Totality of Symptoms */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Totality of Symptoms</h4>
        <div className="space-y-4">
          {[
            { key: 'mental_generals', label: 'Mental Generals', rows: 2 },
            { key: 'physical_generals', label: 'Physical Generals', rows: 2 },
            { key: 'particulars', label: 'Particulars', rows: 2 },
          ].map(({ key, label, rows }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
              <textarea
                value={totality[key] || ''}
                onChange={(e) => update('totality_of_symptoms', { ...totality, [key]: e.target.value })}
                rows={rows}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-y"
                placeholder={`${label}...`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Modalities */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Modalities</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Better From</label>
            <textarea
              value={modalities.better_from || ''}
              onChange={(e) => update('modalities', { ...modalities, better_from: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-y"
              placeholder="Conditions that improve symptoms..."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Worse From</label>
            <textarea
              value={modalities.worse_from || ''}
              onChange={(e) => update('modalities', { ...modalities, worse_from: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-y"
              placeholder="Conditions that worsen symptoms..."
            />
          </div>
        </div>
      </div>

      {/* Miasm */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Miasm Tendency (Optional)</label>
        <select
          value={(data.miasm_tendency as string) || ''}
          onChange={(e) => update('miasm_tendency', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
        >
          <option value="">Select miasm</option>
          {MIASM_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      {/* Remedy */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Remedy Selection</h4>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Remedy Selected</label>
            <input
              type="text"
              value={(data.remedy_selected as string) || ''}
              onChange={(e) => update('remedy_selected', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="e.g. Arnica"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Potency</label>
            <input
              type="text"
              value={(data.potency as string) || ''}
              onChange={(e) => update('potency', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="e.g. 30C"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Dosage</label>
            <input
              type="text"
              value={(data.dosage as string) || ''}
              onChange={(e) => update('dosage', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="e.g. 3 pills twice daily"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
