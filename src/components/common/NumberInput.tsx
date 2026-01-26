import { useState, useCallback, useEffect, useRef } from 'react'

interface NumberInputProps {
  value: number
  onChange: (value: number) => void
  max?: number
  min?: number
  step?: number
  disabled?: boolean
  className?: string
  placeholder?: string
}

export function NumberInput({
  value,
  onChange,
  max,
  min = 0,
  step = 1,
  disabled = false,
  className = '',
  placeholder = '',
}: NumberInputProps) {
  const [displayValue, setDisplayValue] = useState(value.toString())
  const [isFocused, setIsFocused] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(value.toString())
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
        let parsed = parseInt(inputValue, 10)

        if (isNaN(parsed)) {
          parsed = min
        }
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
  }, [])

  const handleBlur = useCallback(() => {
    setIsFocused(false)
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    setDisplayValue(value.toString())
  }, [value])

  return (
    <input
      type="number"
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      disabled={disabled}
      placeholder={placeholder}
      min={min}
      max={max}
      step={step}
      className={`px-3 py-2 border border-gray-300 rounded-md text-right focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500 ${className}`}
    />
  )
}
