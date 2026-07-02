import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { TabBar } from '../components/navigation/TabBar'
import { SnackbarHost } from '../components/ui/Snackbar'
import { AchievementWatcher } from '../components/AchievementWatcher'
import { LoggerHost } from '../modals/LoggerHost'
import { OnboardingSheet } from '../modals/OnboardingSheet'
import { useLoggerStore } from '../stores/loggerStore'

export function Layout() {
  // Home-screen shortcut ("Log a set") lands with ?log=1 — open the logger once
  useEffect(() => {
    if (new URLSearchParams(window.location.search).has('log')) {
      window.history.replaceState(null, '', window.location.pathname + window.location.hash)
      useLoggerStore.getState().openLogger()
    }
  }, [])
  return (
    <div className="min-h-dvh bg-bg text-text">
      {/* pb clears the bar plus the FAB's 32px protrusion */}
      <main className="pb-28 max-w-md mx-auto">
        <Outlet />
      </main>
      <SnackbarHost />
      <AchievementWatcher />
      <LoggerHost />
      <OnboardingSheet />
      <TabBar />
    </div>
  )
}
