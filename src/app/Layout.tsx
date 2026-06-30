import { Outlet } from 'react-router-dom'
import { BottomNav } from '../components/navigation/BottomNav'

export function Layout() {
  return (
    <div className="min-h-dvh bg-navy-50 dark:bg-navy-950 text-navy-900 dark:text-navy-100">
      <main className="pb-20 max-w-md mx-auto">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
