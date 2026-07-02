import { forwardRef, type InputHTMLAttributes } from 'react'
import { SectionLabel } from './SectionLabel'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, className = '', ...props }, ref) => (
    <label className="block">
      {label && <SectionLabel as="span">{label}</SectionLabel>}
      <input
        ref={ref}
        className={`w-full ${label ? 'mt-1.5' : ''} min-h-11 px-3 rounded-xl bg-surface-2 border border-hairline text-text type-body placeholder:text-text-faint outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors ${className}`}
        {...props}
      />
    </label>
  ),
)

Input.displayName = 'Input'
