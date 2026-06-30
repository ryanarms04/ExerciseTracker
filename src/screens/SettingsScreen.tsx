import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, Upload, Sun, Moon, Monitor } from 'lucide-react'
import { db } from '../db/database'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useSettingsStore } from '../stores/settingsStore'

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
      const text = await file.text()
      const data = JSON.parse(text)
      if (data.exercises) {
        await db.exercises.clear()
        await db.exercises.bulkAdd(data.exercises)
      }
      if (data.sessions) {
        await db.sessions.clear()
        await db.sessions.bulkAdd(data.sessions)
      }
      if (data.achievements) {
        await db.achievements.clear()
        await db.achievements.bulkAdd(data.achievements)
      }
      if (data.settings) {
        if (data.settings.userName) setUserName(data.settings.userName)
        if (data.settings.dailyGoal) setDailyGoal(data.settings.dailyGoal)
        if (data.settings.theme) setTheme(data.settings.theme)
      }
    }
    input.click()
  }

  const themes = [
    { value: 'light' as const, icon: Sun, label: 'Light' },
    { value: 'dark' as const, icon: Moon, label: 'Dark' },
    { value: 'system' as const, icon: Monitor, label: 'System' },
  ]

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
        <div>
          <label className="text-xs font-medium text-navy-500 dark:text-navy-400 uppercase tracking-wide">
            Your Name
          </label>
          <input
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="Enter your name"
            className="w-full mt-1 px-3 py-2.5 rounded-xl bg-navy-50 dark:bg-navy-800 border border-navy-200 dark:border-navy-700 text-navy-900 dark:text-white text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-navy-500 dark:text-navy-400 uppercase tracking-wide">
            Daily Goal (reps)
          </label>
          <input
            type="number"
            value={dailyGoal}
            onChange={(e) => setDailyGoal(Math.max(1, Number(e.target.value)))}
            min={1}
            className="w-full mt-1 px-3 py-2.5 rounded-xl bg-navy-50 dark:bg-navy-800 border border-navy-200 dark:border-navy-700 text-navy-900 dark:text-white text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
          />
        </div>
      </Card>

      <Card className="p-4">
        <label className="text-xs font-medium text-navy-500 dark:text-navy-400 uppercase tracking-wide">
          Theme
        </label>
        <div className="flex gap-2 mt-2">
          {themes.map(({ value, icon: Icon, label }) => (
            <button
              key={value}
              onClick={() => setTheme(value)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                theme === value
                  ? 'bg-teal-500 text-white'
                  : 'bg-navy-100 dark:bg-navy-800 text-navy-600 dark:text-navy-400'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-4 space-y-3">
        <h2 className="text-xs font-medium text-navy-500 dark:text-navy-400 uppercase tracking-wide">
          Data
        </h2>
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
