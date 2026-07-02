import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, Upload, Sun, Moon, Monitor } from 'lucide-react'
import { db } from '../db/database'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { SectionLabel } from '../components/ui/SectionLabel'
import { SegmentedControl } from '../components/ui/SegmentedControl'
import { useSettingsStore } from '../stores/settingsStore'
import type { SettingsState } from '../types'

const THEME_OPTIONS: { label: string; value: SettingsState['theme']; icon: typeof Sun }[] = [
  { label: 'Light', value: 'light', icon: Sun },
  { label: 'Dark', value: 'dark', icon: Moon },
  { label: 'System', value: 'system', icon: Monitor },
]

export function SettingsScreen() {
  const navigate = useNavigate()
  const { userName, dailyGoal, theme, setUserName, setDailyGoal, setTheme } = useSettingsStore()

  async function handleExport() {
    const exercises = await db.exercises.toArray()
    const sessions = await db.sessions.toArray()
    const achievements = await db.achievements.toArray()
    const data = JSON.stringify({ exercises, sessions, achievements, settings: { userName, dailyGoal, theme } }, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `exercisetracker-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleImport() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      try {
        const data = JSON.parse(await file.text())

        if (!Array.isArray(data?.exercises) || !Array.isArray(data?.sessions)) {
          throw new Error('not a valid ExerciseTracker backup')
        }
        const exercisesValid = data.exercises.every(
          (x: unknown) => typeof (x as { name?: unknown })?.name === 'string',
        )
        const sessionsValid = data.sessions.every(
          (x: unknown) =>
            typeof (x as { reps?: unknown })?.reps === 'number' &&
            typeof (x as { date?: unknown })?.date === 'string',
        )
        if (!exercisesValid || !sessionsValid) {
          throw new Error('backup contains invalid records')
        }

        const ok = window.confirm(
          `Replace ALL current data with this backup (${data.sessions.length} sessions, ${data.exercises.length} exercises)? This cannot be undone.`,
        )
        if (!ok) return

        await db.transaction('rw', db.exercises, db.sessions, db.achievements, async () => {
          await Promise.all([db.exercises.clear(), db.sessions.clear(), db.achievements.clear()])
          await db.exercises.bulkAdd(data.exercises)
          await db.sessions.bulkAdd(data.sessions)
          if (Array.isArray(data.achievements)) {
            // Dedupe by key: backups from before the unique index may carry doubles
            const unique = [...new Map(
              data.achievements.map((a: { key: string }) => [a.key, a]),
            ).values()]
            await db.achievements.bulkAdd(unique as typeof data.achievements)
          }
        })

        if (data.settings) {
          if (data.settings.userName) setUserName(data.settings.userName)
          if (data.settings.dailyGoal) setDailyGoal(data.settings.dailyGoal)
          if (data.settings.theme) setTheme(data.settings.theme)
        }
        window.alert('Import complete.')
      } catch (err) {
        window.alert(
          `Import failed: ${err instanceof Error ? err.message : 'unknown error'}. No data was changed.`,
        )
      }
    }
    input.click()
  }

  return (
    <div className="px-5 pt-14 pb-4 space-y-5">
      <div>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-navy-500 hover:text-navy-700 dark:hover:text-navy-300 transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <h1 className="font-display text-2xl font-bold text-navy-900 dark:text-white">
          Settings
        </h1>
      </div>

      <Card className="p-4 space-y-4">
        <Input
          label="Your Name"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          placeholder="Enter your name"
        />
        <Input
          label="Daily Goal (reps)"
          type="number"
          value={dailyGoal}
          onChange={(e) => setDailyGoal(Math.max(1, Number(e.target.value)))}
          min={1}
        />
      </Card>

      <Card className="p-4">
        <SectionLabel>Theme</SectionLabel>
        <SegmentedControl
          options={THEME_OPTIONS}
          value={theme}
          onChange={setTheme}
          className="mt-2"
        />
      </Card>

      <Card className="p-4 space-y-3">
        <SectionLabel as="h2">Data</SectionLabel>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={handleExport} className="flex-1">
            <Download size={16} />
            Export
          </Button>
          <Button variant="secondary" onClick={handleImport} className="flex-1">
            <Upload size={16} />
            Import
          </Button>
        </div>
      </Card>
    </div>
  )
}
