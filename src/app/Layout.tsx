import { Outlet } from 'react-router-dom'
import { TabBar } from '../components/navigation/TabBar'
import { SnackbarHost } from '../components/ui/Snackbar'
import { LoggerHost } from '../modals/LoggerHost'

export function Layout() {
  return (
    <div className="min-h-dvh bg-bg text-text">
      {/* pb clears the bar plus the FAB's 32px protrusion */}
      <main className="pb-28 max-w-md mx-auto">
        <Outlet />
      </main>
      <SnackbarHost />
      <LoggerHost />
      <TabBar />
    </div>
  )
}
