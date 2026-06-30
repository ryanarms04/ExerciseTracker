import { type ButtonHTMLAttributes, forwardRef } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'coral'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  fullWidth?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-teal-500 text-white hover:bg-teal-600 active:bg-teal-700 shadow-sm',
  secondary: 'bg-navy-100 text-navy-900 hover:bg-navy-200 dark:bg-navy-800 dark:text-navy-100 dark:hover:bg-navy-700',
  ghost: 'text-navy-600 hover:bg-navy-100 dark:text-navy-400 dark:hover:bg-navy-800',
  coral: 'bg-coral-500 text-white hover:bg-coral-600 active:bg-coral-700',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3.5 text-base',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', fullWidth, className = '', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`
          inline-flex items-center justify-center gap-2 font-semibold
          rounded-[var(--radius-card-sm)] transition-all duration-150
          disabled:opacity-40 disabled:pointer-events-none
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `}
        {...props}
      >
        {children}
      </button>
    )
  },
)

Button.displayName = 'Button'
