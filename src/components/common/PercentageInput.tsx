import { useState, useCallback, useEffect, useRef } from 'react'
import { formatPercentage, parsePercentage } from '@/utils/formatters'

interface PercentageInputProps {
  value: number // decimal (e.g., 0.04 for 4%)
  onChange: (value: number) => void
  max?: number
  min?: number
  disabled?: boolean
  className?: string
}

export function PercentageInput({
  value,
  onChange,
  max = 1,
  min = 0,
  disabled = false,
  className = '',
}: PercentageInputProps) {
  const [displayValue, setDisplayValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(formatPercentage(value))
    }
  }, [value, isFocused])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value
      setDisplayValue(inputValue)

      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }

      debounceRef.current = setTimeout(() => {
        let parsed = parsePercentage(inputValue)

        if (parsed > max) {
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
    setDisplayValue((value * 100).toString())
  }, [value])

  const handleBlur = useCallback(() => {
    setIsFocused(false)
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    setDisplayValue(formatPercentage(value))
  }, [value])

  return (
    <input
      type="text"
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      disabled={disabled}
      className={`px-3 py-2 border border-gray-300 rounded-md text-right focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 ${className}`}
    />
  )
}
