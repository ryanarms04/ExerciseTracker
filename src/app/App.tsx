import { useEffect } from 'react'
import { MotionConfig } from 'motion/react'
import { Router } from './Router'
import { useTheme } from '../hooks/useTheme'
import { seedDatabase } from '../db/seed'

export default function App() {
  useTheme()

  useEffect(() => {
    seedDatabase()
  }, [])

  return (
    <MotionConfig reducedMotion="user">
      <Router />
    </MotionConfig>
  )
}
