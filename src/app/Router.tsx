import { HashRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './Layout'
import { HomeScreen } from '../screens/HomeScreen'
import { WorkoutsScreen } from '../screens/WorkoutsScreen'
import { ProfileScreen } from '../screens/ProfileScreen'
import { ExerciseDetailScreen } from '../screens/ExerciseDetailScreen'
import { SettingsScreen } from '../screens/SettingsScreen'

export function Router() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomeScreen />} />
          <Route path="workouts" element={<WorkoutsScreen />} />
          <Route path="profile" element={<ProfileScreen />} />
          <Route path="exercise/:id" element={<ExerciseDetailScreen />} />
          <Route path="settings" element={<SettingsScreen />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
