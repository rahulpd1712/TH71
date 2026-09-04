import { useState, useRef, useEffect } from 'react'
import { searchNamaste, type NamasteMapping } from '../lib/namasteCodes'

interface Props {
  value: string
  onChange: (diagnosis: string) => void
  onCodeSelect: (namasteCode: string, icd11Code: string) => void
  stream: string
}

export default function DiagnosisAutocomplete({ value, onChange, onCodeSelect, stream }: Props) {
  const [query, setQuery] = useState(value)
  const [suggestions, setSuggestions] = useState<NamasteMapping[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Sync external value changes
  useEffect(() => {
    setQuery(value)
  }, [value])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleInputChange(val: string) {
    setQuery(val)
    onChange(val)
    setHighlightedIndex(-1)

    if (val.length >= 2) {
      const results = searchNamaste(val).filter(
        m => m.stream === stream || val.toLowerCase().includes(m.diagnosis.toLowerCase())
      )
      // Prioritize matching stream, then show others
      const sameStream = results.filter(m => m.stream === stream)
      const otherStream = results.filter(m => m.stream !== stream)
      setSuggestions([...sameStream, ...otherStream].slice(0, 8))
      setShowDropdown(true)
    } else {
      setSuggestions([])
      setShowDropdown(false)
    }
  }

  function handleSelect(mapping: NamasteMapping) {
    setQuery(mapping.diagnosis)
    onChange(mapping.diagnosis)
    onCodeSelect(mapping.namaste_code, mapping.icd11_tm2_code)
    setShowDropdown(false)
    setHighlightedIndex(-1)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!showDropdown || suggestions.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex(prev => Math.min(prev + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault()
      handleSelect(suggestions[highlightedIndex])
    } else if (e.key === 'Escape') {
      setShowDropdown(false)
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => query.length >= 2 && suggestions.length > 0 && setShowDropdown(true)}
        onKeyDown={handleKeyDown}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
        placeholder="Type to search diagnosis (NAMASTE/ICD-11)..."
      />
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {suggestions.map((s, i) => (
            <button
              key={s.diagnosis + s.namaste_code}
              onClick={() => handleSelect(s)}
              className={`w-full px-4 py-2.5 text-left hover:bg-emerald-50 flex items-center justify-between border-b border-gray-50 last:border-0 ${
                i === highlightedIndex ? 'bg-emerald-50' : ''
              }`}
            >
              <div>
                <span className="font-medium text-gray-900">{s.diagnosis}</span>
                <span className="text-xs text-gray-400 ml-2 capitalize">({s.stream})</span>
              </div>
              <div className="flex gap-2 text-xs">
                <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-mono">{s.namaste_code}</span>
                <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-mono">{s.icd11_tm2_code}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
