import type { LucideProps } from 'lucide-react'
import { ICON_MAP } from './icons'

interface DynamicIconProps extends LucideProps {
  name: string
}

export function DynamicIcon({ name, ...props }: DynamicIconProps) {
  const Icon = ICON_MAP[name] ?? ICON_MAP.activity
  return <Icon {...props} />
}
