interface Props {
  data: Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
}

const MIZAJ_OPTIONS = [
  "Damavi (Sanguine)", "Balghami (Phlegmatic)", "Safrawi (Choleric)", "Khalivi (Melancholic)",
  "Mutadil (Temperate)"
]

export default function UnaniForm({ data, onChange }: Props) {
  function update(field: string, value: unknown) {
    onChange({ ...data, [field]: value })
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Mizaj (Temperament)</label>
        <select
          value={(data.mizaj as string) || ''}
          onChange={(e) => update('mizaj', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
        >
          <option value="">Select mizaj</option>
          {MIZAJ_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Akhlat Status (Humors)</label>
        <textarea
          value={(data.akhlat_status as string) || ''}
          onChange={(e) => update('akhlat_status', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-y"
          placeholder="Status of Dam (Blood), Balgham (Phlegm), Safra (Yellow bile), Sauda (Black bile)..."
        />
      </div>
    </div>
  )
}
