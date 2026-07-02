import { useState } from 'react'
import { BottomSheet } from '../components/ui/BottomSheet'
import { Button } from '../components/ui/Button'
import { DynamicIcon } from '../components/ui/DynamicIcon'
import { Input } from '../components/ui/Input'
import { SectionLabel } from '../components/ui/SectionLabel'
import { SegmentedControl } from '../components/ui/SegmentedControl'
import { db } from '../db/database'
import type { ExerciseCategory } from '../types'

interface AddExerciseModalProps {
  open: boolean
  onClose: () => void
}

const CATEGORIES: { label: string; value: ExerciseCategory }[] = [
  { label: 'Upper Body', value: 'upper' },
  { label: 'Core', value: 'core' },
  { label: 'Lower Body', value: 'lower' },
]

const ICONS = [
  'dumbbell', 'heart', 'star', 'zap', 'flame', 'target',
  'shield', 'bolt', 'circle-dot', 'hexagon', 'octagon', 'triangle',
]

const COLORS = ['#0EA5A2', '#FF6B6B', '#64748B', '#8B5CF6', '#F59E0B', '#10B981']

export function AddExerciseModal({ open, onClose }: AddExerciseModalProps) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState<ExerciseCategory>('upper')
  const [icon, setIcon] = useState('dumbbell')
  const [color, setColor] = useState('#0EA5A2')

  async function handleSave() {
    if (!name.trim()) return
    await db.exercises.add({
      name: name.trim(),
      category,
      icon,
      color,
      isCustom: true,
      isArchived: false,
      createdAt: new Date().toISOString(),
    })
    setName('')
    setCategory('upper')
    setIcon('dumbbell')
    setColor('#0EA5A2')
    onClose()
  }

  return (
    <BottomSheet open={open} onClose={onClose}>
      <h3 className="font-display text-lg font-bold text-navy-900 dark:text-white mb-4">
        New Exercise
      </h3>

      <div className="space-y-4">
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
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  icon === ic
                    ? 'bg-teal-500 text-white ring-2 ring-teal-300'
                    : 'bg-navy-100 dark:bg-navy-800 text-navy-600 dark:text-navy-400'
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
                className={`w-9 h-9 rounded-full transition-transform ${
                  color === c ? 'scale-110 ring-2 ring-offset-2 ring-offset-white dark:ring-offset-navy-900' : ''
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <Button onClick={handleSave} fullWidth size="lg" disabled={!name.trim()}>
          Add Exercise
        </Button>
      </div>
    </BottomSheet>
  )
}
