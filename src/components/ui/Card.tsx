import type { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'elevated' | 'flat' | 'outlined'
}

export function Card({ variant = 'elevated', className = '', children, ...props }: CardProps) {
  const base = 'rounded-[var(--radius-card)]'

  // Depth via hairlines and surface steps — no drop shadows (REDESIGN §2)
  const variants = {
    elevated: 'bg-surface border border-hairline',
    flat: 'bg-surface-2',
    outlined: 'bg-surface border border-hairline',
  }

  return (
    <div className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </div>
  )
}
