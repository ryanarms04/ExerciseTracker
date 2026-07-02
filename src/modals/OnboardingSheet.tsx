import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Minus, Plus, Check } from 'lucide-react'
import { Sheet } from '../components/ui/Sheet'
import { Input } from '../components/ui/Input'
import { SectionLabel } from '../components/ui/SectionLabel'
import { DynamicIcon } from '../components/ui/DynamicIcon'
import { RingGauge } from '../components/charts/RingGauge'
import { db } from '../db/database'
import { useSettingsStore } from '../stores/settingsStore'

/**
 * First-run setup: ① name + goal with a live ring preview (teaches the ring
 * metaphor before screen one), ② pick starting exercises (unpicked are
 * archived, recoverable). Existing users — anyone with sessions — never see it.
 */
export function OnboardingSheet() {
  const { userName, dailyGoal, hasCompletedOnboarding, setUserName, setDailyGoal, completeOnboarding } =
    useSettingsStore()
  const [step, setStep] = useState<1 | 2>(1)
  const [picked, setPicked] = useState<Set<number> | null>(null)

  const sessionCount = useLiveQuery(() => db.sessions.count(), [])
  const exercises = useLiveQuery(async () => {
    const all = await db.exercises.toArray()
    return all.filter((e) => !e.isArchived)
  }, [])

  // The flag shipped after the app did: devices with history skip silently
  useEffect(() => {
    if (!hasCompletedOnboarding && sessionCount !== undefined && sessionCount > 0) {
      completeOnboarding()
    }
  }, [hasCompletedOnboarding, sessionCount, completeOnboarding])

  const open = !hasCompletedOnboarding && sessionCount === 0

  const selection = picked ?? new Set((exercises ?? []).map((e) => e.id!))

  function toggle(id: number) {
    const next = new Set(selection)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setPicked(next)
  }

  async function finish() {
    const unpicked = (exercises ?? []).filter((e) => !selection.has(e.id!))
    for (const ex of unpicked) {
      await db.exercises.update(ex.id!, { isArchived: true })
    }
    completeOnboarding()
  }

  return (
    <Sheet open={open} onClose={completeOnboarding} title="Welcome">
      <div className="max-w-sm mx-auto">
        {step === 1 ? (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-3">
              <RingGauge value={Math.round(dailyGoal * 0.6)} goal={dailyGoal} size={110} strokeWidth={9} />
              <p className="type-caption text-text-faint text-center">
                Every day you spin this ring toward your goal
              </p>
            </div>

            <Input
              label="Your Name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="What should we call you?"
            />

            <div>
              <SectionLabel>Daily goal (reps)</SectionLabel>
              <div className="flex items-center justify-center gap-3 mt-2">
                <button
                  onClick={() => setDailyGoal(Math.max(5, dailyGoal - 5))}
                  disabled={dailyGoal <= 5}
                  aria-label="Decrease daily goal"
                  className="w-11 h-11 flex items-center justify-center rounded-full bg-surface-2 border border-hairline text-text-mute disabled:opacity-30"
                >
                  <Minus size={16} />
                </button>
                <span className="num-md text-text w-16 text-center">{dailyGoal}</span>
                <button
                  onClick={() => setDailyGoal(dailyGoal + 5)}
                  aria-label="Increase daily goal"
                  className="w-11 h-11 flex items-center justify-center rounded-full bg-surface-2 border border-hairline text-text-mute"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full min-h-14 rounded-2xl bg-accent text-accent-ink type-heading"
            >
              Continue
            </button>
            <button
              onClick={completeOnboarding}
              className="min-h-11 type-label text-text-faint"
            >
              Skip for now
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <div>
              <h3 className="type-heading text-text">Pick your exercises</h3>
              <p className="type-caption text-text-faint mt-1">
                Unpicked ones are archived, not deleted — restore them any time in the Library.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {(exercises ?? []).map((ex) => {
                const on = selection.has(ex.id!)
                return (
                  <button
                    key={ex.id}
                    onClick={() => toggle(ex.id!)}
                    aria-pressed={on}
                    className={`flex items-center gap-2.5 p-2.5 rounded-[var(--radius-tile)] border text-left transition-colors ${
                      on ? 'bg-surface border-accent' : 'bg-surface border-hairline opacity-60'
                    }`}
                  >
                    <span
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: ex.color + '1F', color: ex.color }}
                    >
                      <DynamicIcon name={ex.icon} size={16} />
                    </span>
                    <span className="type-label text-text truncate flex-1">{ex.name}</span>
                    {on && <Check size={14} className="text-accent shrink-0" />}
                  </button>
                )
              })}
            </div>

            <button
              onClick={finish}
              disabled={selection.size === 0}
              className="w-full min-h-14 rounded-2xl bg-accent text-accent-ink type-heading disabled:opacity-40"
            >
              {selection.size === 0 ? 'Pick at least one' : `Start with ${selection.size}`}
            </button>
          </div>
        )}
      </div>
    </Sheet>
  )
}
