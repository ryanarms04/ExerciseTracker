import { db } from './database'
import type { Exercise } from '../types'

/** Bump when seeds or one-shot healings change; each version runs once per device. */
const SEED_VERSION = 1
const SEED_VERSION_KEY = 'exercise-tracker-seed-version'

const DEFAULT_EXERCISES: Omit<Exercise, 'id'>[] = [
  { name: 'Push-ups', category: 'upper', icon: 'chevrons-up', color: '#0EA5A2', isCustom: false, isArchived: false, createdAt: new Date().toISOString() },
  { name: 'Tricep Dips', category: 'upper', icon: 'arrow-down-to-line', color: '#2ECFCC', isCustom: false, isArchived: false, createdAt: new Date().toISOString() },
  { name: 'Diamond Push-ups', category: 'upper', icon: 'diamond', color: '#0D8F8C', isCustom: false, isArchived: false, createdAt: new Date().toISOString() },
  { name: 'Wide Push-ups', category: 'upper', icon: 'move-horizontal', color: '#0B7472', isCustom: false, isArchived: false, createdAt: new Date().toISOString() },
  { name: 'Sit-ups', category: 'core', icon: 'flip-vertical-2', color: '#FF6B6B', isCustom: false, isArchived: false, createdAt: new Date().toISOString() },
  { name: 'Crunches', category: 'core', icon: 'minimize-2', color: '#FF8787', isCustom: false, isArchived: false, createdAt: new Date().toISOString() },
  { name: 'Leg Raises', category: 'core', icon: 'arrow-up-from-line', color: '#E85555', isCustom: false, isArchived: false, createdAt: new Date().toISOString() },
  { name: 'Plank (seconds)', category: 'core', icon: 'timer', color: '#C44040', isCustom: false, isArchived: false, createdAt: new Date().toISOString() },
  { name: 'Squats', category: 'lower', icon: 'arrow-down', color: '#64748B', isCustom: false, isArchived: false, createdAt: new Date().toISOString() },
  { name: 'Lunges', category: 'lower', icon: 'footprints', color: '#475569', isCustom: false, isArchived: false, createdAt: new Date().toISOString() },
  { name: 'Calf Raises', category: 'lower', icon: 'trending-up', color: '#334155', isCustom: false, isArchived: false, createdAt: new Date().toISOString() },
  { name: 'Glute Bridges', category: 'lower', icon: 'mountain', color: '#1E293B', isCustom: false, isArchived: false, createdAt: new Date().toISOString() },
]

let seeding: Promise<void> | null = null

/**
 * Seeds defaults and runs one-shot data healings, once per SEED_VERSION per
 * device. The module-level promise also collapses StrictMode's double effect
 * run into a single pass.
 */
export function seedDatabase() {
  seeding ??= runSeed()
  return seeding
}

async function runSeed() {
  if (Number(localStorage.getItem(SEED_VERSION_KEY) ?? 0) >= SEED_VERSION) return

  await db.transaction('rw', db.exercises, async () => {
    const existing = await db.exercises.toArray()
    const existingNames = new Set(existing.map((e) => e.name))

    const toAdd = DEFAULT_EXERCISES.filter((e) => !existingNames.has(e.name))
    if (toAdd.length > 0) {
      await db.exercises.bulkAdd(toAdd)
    }

    // Healings for prior bugs, harmless on clean data:
    // duplicate seeds from the unguarded seed race
    const seen = new Set<string>()
    const dupeIds: number[] = []
    for (const ex of existing) {
      if (seen.has(ex.name) && !ex.isCustom) {
        dupeIds.push(ex.id!)
      }
      seen.add(ex.name)
    }
    if (dupeIds.length > 0) {
      await db.exercises.bulkDelete(dupeIds)
    }

    // Sit-ups shipped with an icon name that doesn't exist in lucide
    const situps = existing.find((e) => e.name === 'Sit-ups' && e.icon === 'flip-vertical')
    if (situps?.id) {
      await db.exercises.update(situps.id, { icon: 'flip-vertical-2' })
    }
  })

  localStorage.setItem(SEED_VERSION_KEY, String(SEED_VERSION))
}
