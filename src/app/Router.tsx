import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { Layout } from './Layout'
import { HomeScreen } from '../screens/HomeScreen'
import { WorkoutsScreen } from '../screens/WorkoutsScreen'
import { ProfileScreen } from '../screens/ProfileScreen'
import { ExerciseDetailScreen } from '../screens/ExerciseDetailScreen'
import { SettingsScreen } from '../screens/SettingsScreen'

export function Router() {
  return (
    <HashRouter>
      <ErrorBoundary>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomeScreen />} />
            <Route path="you" element={<ProfileScreen />} />
            <Route path="library" element={<WorkoutsScreen />} />
            <Route path="exercise/:id" element={<ExerciseDetailScreen />} />
            <Route path="settings" element={<SettingsScreen />} />
            {/* old tab URLs live in muscle memory and bookmarks */}
            <Route path="workouts" element={<Navigate to="/library" replace />} />
            <Route path="profile" element={<Navigate to="/you" replace />} />
          </Route>
        </Routes>
      </ErrorBoundary>
    </HashRouter>
  )
}
