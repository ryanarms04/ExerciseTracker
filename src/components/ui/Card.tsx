import type { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'elevated' | 'flat' | 'outlined'
}

export function Card({ variant = 'elevated', className = '', children, ...props }: CardProps) {
  const base = 'rounded-[var(--radius-card)] transition-shadow duration-200'

  const variants = {
    elevated: 'bg-white dark:bg-navy-900 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)]',
    flat: 'bg-navy-50 dark:bg-navy-900',
    outlined: 'border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-900',
  }

  return (
    <div className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </div>
  )
}
