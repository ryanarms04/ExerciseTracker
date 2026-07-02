import type { LucideIcon } from 'lucide-react'

interface SegmentedOption<T extends string> {
  label: string
  value: T
  icon?: LucideIcon
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  /** 'fill': equal-width segments. 'scroll': self-sized pills in a scrollable row. */
  layout?: 'fill' | 'scroll'
  className?: string
}

/** One selected-out-of-N control: theme picker, category picker, filter pills. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  layout = 'fill',
  className = '',
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      className={`flex gap-2 ${layout === 'scroll' ? 'overflow-x-auto scrollbar-hide pb-1' : ''} ${className}`}
    >
      {options.map((opt) => {
        const selected = opt.value === value
        const Icon = opt.icon
        return (
          <button
            key={opt.value}
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(opt.value)}
            className={`${layout === 'fill' ? 'flex-1' : 'shrink-0'} inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded-full type-label whitespace-nowrap transition-colors ${
              selected
                ? 'bg-accent text-accent-ink'
                : 'bg-surface-2 text-text-mute border border-hairline'
            }`}
          >
            {Icon && <Icon size={16} />}
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
