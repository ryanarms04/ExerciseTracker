import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { Layout } from './Layout'
import { TodayScreen } from '../screens/TodayScreen'
import { WorkoutsScreen } from '../screens/WorkoutsScreen'
import { YouScreen } from '../screens/YouScreen'
import { ExerciseDetailScreen } from '../screens/ExerciseDetailScreen'

export function Router() {
  return (
    <HashRouter>
      <ErrorBoundary>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<TodayScreen />} />
            <Route path="you" element={<YouScreen />} />
            <Route path="library" element={<WorkoutsScreen />} />
            <Route path="exercise/:id" element={<ExerciseDetailScreen />} />
            {/* old URLs live in muscle memory and bookmarks */}
            <Route path="workouts" element={<Navigate to="/library" replace />} />
            <Route path="profile" element={<Navigate to="/you" replace />} />
            <Route path="settings" element={<Navigate to="/you" replace />} />
          </Route>
        </Routes>
      </ErrorBoundary>
    </HashRouter>
  )
}
