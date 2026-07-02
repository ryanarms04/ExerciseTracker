import type { ElementType, ReactNode } from 'react'

interface SectionLabelProps {
  children: ReactNode
  as?: ElementType
  className?: string
}

/** Small muted label above form fields and settings sections. */
export function SectionLabel({ children, as: Tag = 'p', className = '' }: SectionLabelProps) {
  return <Tag className={`block type-caption uppercase text-text-faint ${className}`}>{children}</Tag>
}
