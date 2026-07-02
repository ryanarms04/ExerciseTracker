import { forwardRef, type ButtonHTMLAttributes } from 'react'

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean
}

/** Pill-shaped tap target (quick-add amounts, date chips, snackbar actions). */
export const Chip = forwardRef<HTMLButtonElement, ChipProps>(
  ({ selected, className = '', children, ...props }, ref) => (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center gap-1.5 min-h-11 px-4 rounded-full type-label transition-colors disabled:opacity-30 disabled:pointer-events-none ${
        selected
          ? 'bg-accent text-accent-ink'
          : 'bg-surface-2 text-text-mute border border-hairline'
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  ),
)

Chip.displayName = 'Chip'
