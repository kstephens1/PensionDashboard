interface ToggleSwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  description?: string
}

export function ToggleSwitch({ checked, onChange, label, description }: ToggleSwitchProps) {
  const handleToggle = () => {
    onChange(!checked)
  }

  return (
    <label className="inline-flex items-center cursor-pointer">
      <span className="mr-3">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        {description && (
          <span className="block text-xs text-gray-500">{description}</span>
        )}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={handleToggle}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          checked ? 'bg-blue-600' : 'bg-gray-200'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </label>
  )
}
