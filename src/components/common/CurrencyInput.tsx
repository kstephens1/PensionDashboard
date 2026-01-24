import { useState, useCallback, useEffect, useRef } from 'react'
import { formatCurrency, parseCurrency } from '@/utils/formatters'

interface CurrencyInputProps {
  value: number
  onChange: (value: number) => void
  max?: number
  min?: number
  disabled?: boolean
  className?: string
  placeholder?: string
}

export function CurrencyInput({
  value,
  onChange,
  max,
  min = 0,
  disabled = false,
  className = '',
  placeholder = '£0.00',
}: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(value > 0 ? formatCurrency(value) : '')
    }
  }, [value, isFocused])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value
      setDisplayValue(inputValue)

      // Debounce the actual onChange
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }

      debounceRef.current = setTimeout(() => {
        let parsed = parseCurrency(inputValue)

        if (max !== undefined && parsed > max) {
          parsed = max
        }
        if (parsed < min) {
          parsed = min
        }

        onChange(parsed)
      }, 300)
    },
    [onChange, max, min]
  )

  const handleFocus = useCallback(() => {
    setIsFocused(true)
    setDisplayValue(value > 0 ? value.toString() : '')
  }, [value])

  const handleBlur = useCallback(() => {
    setIsFocused(false)
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    setDisplayValue(value > 0 ? formatCurrency(value) : '')
  }, [value])

  return (
    <input
      type="text"
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      disabled={disabled}
      placeholder={placeholder}
      className={`px-3 py-2 border border-gray-300 rounded-md text-right focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500 ${className}`}
    />
  )
}
