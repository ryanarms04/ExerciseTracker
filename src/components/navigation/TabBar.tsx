import { NavLink } from 'react-router-dom'
import { Home, User, Plus } from 'lucide-react'
import { motion } from 'motion/react'
import { useHaptic } from '../../hooks/useHaptic'
import { useLoggerStore } from '../../stores/loggerStore'
import { useDayStore } from '../../stores/dayStore'
import { todayStr } from '../../lib/dateUtils'

const TABS = [
  { to: '/', icon: Home, label: 'Today' },
  { to: '/you', icon: User, label: 'You' },
]

/** Two tabs and the physical Log button — the app's most-used action gets
    its own always-reachable, look-free target. */
export function TabBar() {
  const haptic = useHaptic()
  const openLogger = useLoggerStore((s) => s.openLogger)
  const selectedDate = useDayStore((s) => s.selectedDate)

  // Viewing a past day is a loud mode: the FAB carries the date it will log to
  const offToday = selectedDate !== todayStr()
  const badge = offToday
    ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
    : null

  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 bg-surface/85 backdrop-blur-lg border-t border-hairline safe-bottom">
      <div className="relative grid grid-cols-3 items-stretch h-16 max-w-md mx-auto">
        <TabLink {...TABS[0]} />

        <div className="relative">
          <motion.button
            onClick={() => {
              haptic.tick()
              openLogger()
            }}
            whileTap={{ scale: 0.92 }}
            aria-label={badge ? `Log reps for ${badge}` : 'Log reps'}
            className="absolute left-1/2 -translate-x-1/2 -top-8 w-16 h-16 rounded-full bg-accent text-accent-ink flex items-center justify-center shadow-[0_4px_16px_rgb(45_212_207/0.35)]"
          >
            <Plus size={30} strokeWidth={2.5} />
            {badge && (
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-surface-2 border border-ember text-ember type-caption whitespace-nowrap">
                {badge}
              </span>
            )}
          </motion.button>
        </div>

        <TabLink {...TABS[1]} />
      </div>
    </nav>
  )
}

function TabLink({ to, icon: Icon, label }: (typeof TABS)[number]) {
  return (
    <NavLink to={to} end={to === '/'} className="flex flex-col items-center justify-center gap-0.5">
      {({ isActive }) => (
        <>
          <Icon size={22} className={isActive ? 'text-accent' : 'text-text-faint'} />
          <span className={`type-caption ${isActive ? 'text-accent' : 'text-text-faint'}`}>
            {label}
          </span>
        </>
      )}
    </NavLink>
  )
}
