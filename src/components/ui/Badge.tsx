import type { HTMLAttributes } from 'react'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'teal' | 'coral' | 'neutral'
}

export function Badge({ variant = 'teal', className = '', children, ...props }: BadgeProps) {
  const variants = {
    teal: 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
    coral: 'bg-coral-50 text-coral-700 dark:bg-coral-900/30 dark:text-coral-400',
    neutral: 'bg-navy-100 text-navy-600 dark:bg-navy-800 dark:text-navy-400',
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-[var(--radius-badge)] ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}
