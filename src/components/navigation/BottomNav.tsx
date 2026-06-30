import { NavLink } from 'react-router-dom'
import { Home, Dumbbell, User } from 'lucide-react'
import { motion } from 'motion/react'

const tabs = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/workouts', icon: Dumbbell, label: 'Workouts' },
  { to: '/profile', icon: User, label: 'Profile' },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/80 dark:bg-navy-950/80 backdrop-blur-lg border-t border-navy-200/50 dark:border-navy-800/50 safe-bottom">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto">
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className="relative flex flex-col items-center gap-0.5 px-4 py-2"
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute -top-px left-3 right-3 h-0.5 bg-teal-500 rounded-full"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon
                  size={22}
                  className={`transition-colors duration-200 ${
                    isActive ? 'text-teal-500' : 'text-navy-400 dark:text-navy-500'
                  }`}
                />
                <span
                  className={`text-[10px] font-medium transition-colors duration-200 ${
                    isActive ? 'text-teal-500' : 'text-navy-400 dark:text-navy-500'
                  }`}
                >
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
