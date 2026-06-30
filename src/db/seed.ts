import { db } from './database'
import type { Exercise } from '../types'

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

export async function seedDatabase() {
  const existing = await db.exercises.toArray()
  const existingNames = new Set(existing.map((e) => e.name))

  const toAdd = DEFAULT_EXERCISES.filter((e) => !existingNames.has(e.name))
  if (toAdd.length > 0) {
    await db.exercises.bulkAdd(toAdd)
  }

  // clean up duplicates from prior seed bug
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

  const situps = existing.find((e) => e.name === 'Sit-ups' && e.icon === 'flip-vertical')
  if (situps?.id) {
    await db.exercises.update(situps.id, { icon: 'flip-vertical-2' })
  }
}
