import { useEffect } from 'react'
import { Router } from './Router'
import { useTheme } from '../hooks/useTheme'
import { seedDatabase } from '../db/seed'

export default function App() {
  useTheme()

  useEffect(() => {
    seedDatabase()
  }, [])

  return <Router />
}
