import { useState, useEffect, useRef } from 'react'
import { Sheet } from '../components/ui/Sheet'
import { Input } from '../components/ui/Input'
import { SectionLabel } from '../components/ui/SectionLabel'
import { SegmentedControl } from '../components/ui/SegmentedControl'
import { DynamicIcon } from '../components/ui/DynamicIcon'
import { db } from '../db/database'
import type { Exercise, ExerciseCategory } from '../types'

interface ExerciseFormSheetProps {
  open: boolean
  onClose: () => void
  /** Set = edit this exercise; otherwise create a new one. */
  exercise?: Exercise | null
}

const CATEGORIES: { label: string; value: ExerciseCategory }[] = [
  { label: 'Upper', value: 'upper' },
  { label: 'Core', value: 'core' },
  { label: 'Lower', value: 'lower' },
]

const ICONS = [
  'dumbbell', 'heart', 'star', 'zap', 'flame', 'target',
  'shield', 'bolt', 'circle-dot', 'hexagon', 'octagon', 'triangle',
]

const COLORS = ['#0EA5A2', '#FF6B6B', '#64748B', '#8B5CF6', '#F59E0B', '#10B981']

/** One form for new and edited exercises, in the app's single Sheet shell. */
export function ExerciseFormSheet({ open, onClose, exercise }: ExerciseFormSheetProps) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState<ExerciseCategory>('upper')
  const [icon, setIcon] = useState('dumbbell')
  const [color, setColor] = useState(COLORS[0])
  const wasOpen = useRef(false)

  useEffect(() => {
    if (open && !wasOpen.current) {
      setName(exercise?.name ?? '')
      setCategory(exercise?.category === 'custom' ? 'upper' : (exercise?.category ?? 'upper'))
      setIcon(exercise?.icon ?? 'dumbbell')
      setColor(exercise?.color ?? COLORS[0])
    }
    wasOpen.current = open
  }, [open, exercise])

  async function handleSave() {
    const trimmed = name.trim()
    if (!trimmed) return
    if (exercise?.id) {
      await db.exercises.update(exercise.id, { name: trimmed, category, icon, color })
    } else {
      await db.exercises.add({
        name: trimmed,
        category,
        icon,
        color,
        isCustom: true,
        isArchived: false,
        createdAt: new Date().toISOString(),
      })
    }
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} title={exercise ? 'Edit exercise' : 'New exercise'}>
      <div className="max-w-sm mx-auto space-y-5">
        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Burpees"
        />

        <div>
          <SectionLabel>Category</SectionLabel>
          <SegmentedControl
            options={CATEGORIES}
            value={category}
            onChange={setCategory}
            className="mt-1.5"
          />
        </div>

        <div>
          <SectionLabel>Icon</SectionLabel>
          <div className="flex flex-wrap gap-2 mt-1.5">
            {ICONS.map((ic) => (
              <button
                key={ic}
                onClick={() => setIcon(ic)}
                aria-label={`Icon: ${ic}`}
                aria-pressed={icon === ic}
                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${
                  icon === ic
                    ? 'bg-accent text-accent-ink'
                    : 'bg-surface-2 border border-hairline text-text-mute'
                }`}
              >
                <DynamicIcon name={ic} size={18} />
              </button>
            ))}
          </div>
        </div>

        <div>
          <SectionLabel>Color</SectionLabel>
          <div className="flex gap-2 mt-1.5">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                aria-label={`Color ${c}`}
                aria-pressed={color === c}
                className={`w-11 h-11 rounded-full transition-transform ${
                  color === c ? 'scale-110 ring-2 ring-accent ring-offset-2 ring-offset-bg' : ''
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={!name.trim()}
          className="w-full min-h-14 rounded-2xl bg-accent text-accent-ink type-heading disabled:opacity-40 transition-opacity"
        >
          {exercise ? 'Save changes' : 'Add exercise'}
        </button>
      </div>
    </Sheet>
  )
}
