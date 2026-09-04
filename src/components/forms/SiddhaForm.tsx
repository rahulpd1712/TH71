interface Props {
  data: Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
}

const ENVAGAI_FIELDS = [
  { key: 'naa', label: 'Naa (Pulse)', placeholder: 'Pulse characteristics' },
  { key: 'niram', label: 'Niram (Complexion)', placeholder: 'Skin color/complexion' },
  { key: 'mozhi', label: 'Mozhi (Tongue)', placeholder: 'Tongue appearance' },
  { key: 'vizhi', label: 'Vizhi (Eye)', placeholder: 'Eye examination' },
  { key: 'sparism', label: 'Sparism (Touch)', placeholder: 'Touch/palpation findings' },
  { key: 'malam', label: 'Malam (Stool)', placeholder: 'Stool examination' },
  { key: 'moothiram', label: 'Moothiram (Urine)', placeholder: 'Urine examination' },
  { key: 'naadi', label: 'Naadi (Nadi)', placeholder: 'Nadi examination' },
]

export default function SiddhaForm({ data, onChange }: Props) {
  const envagai = (data.envagai_thervu as Record<string, string>) || {}

  function update(field: string, value: unknown) {
    onChange({ ...data, [field]: value })
  }

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Envagai Thervu (Physical Examination)</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {ENVAGAI_FIELDS.map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
              <input
                type="text"
                value={envagai[key] || ''}
                onChange={(e) => update('envagai_thervu', { ...envagai, [key]: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder={placeholder}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
