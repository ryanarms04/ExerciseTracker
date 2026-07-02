import { useEffect, useRef } from 'react'
import { DynamicIcon } from '../ui/DynamicIcon'
import type { Exercise } from '../../types'

interface ExerciseCarouselProps {
  exercises: Exercise[]
  selectedId: number | null
  onSelect: (exercise: Exercise) => void
  /** Edit mode: the session's exercise can't change. */
  locked?: boolean
}

/** Snap carousel in the logger header — the exercise picker lives inside the
    logger, so the FAB can open straight here with the last-used armed. */
export function ExerciseCarousel({ exercises, selectedId, onSelect, locked }: ExerciseCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const hasCentered = useRef(false)

  useEffect(() => {
    const el = scrollRef.current?.querySelector(`[data-id="${selectedId}"]`)
    if (!el) return
    el.scrollIntoView({
      inline: 'center',
      block: 'nearest',
      behavior: hasCentered.current ? 'smooth' : 'instant',
    })
    hasCentered.current = true
  }, [selectedId])

  return (
    <div
      ref={scrollRef}
      // w-full + max-w-full: without a width bound the flex column sizes this
      // to its content and the whole sheet scrolls sideways instead of the strip
      className="w-full max-w-full flex gap-1 overflow-x-auto scrollbar-hide snap-x px-2 no-select"
    >
      {exercises.map((ex) => {
        const selected = ex.id === selectedId
        const dimmed = locked && !selected
        return (
          <button
            key={ex.id}
            data-id={ex.id}
            onClick={() => onSelect(ex)}
            disabled={locked}
            aria-pressed={selected}
            className={`flex flex-col items-center gap-1 px-3 py-1.5 snap-center shrink-0 rounded-2xl transition-opacity ${
              dimmed ? 'opacity-30' : selected ? '' : 'opacity-60'
            }`}
          >
            <span
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: ex.color + '1F', color: ex.color }}
            >
              <DynamicIcon name={ex.icon} size={18} />
            </span>
            <span className={`type-label max-w-24 truncate ${selected ? 'text-text' : 'text-text-mute'}`}>
              {ex.name}
            </span>
            <span
              className={`h-0.5 w-6 rounded-full ${selected ? 'bg-accent' : 'bg-transparent'}`}
            />
          </button>
        )
      })}
    </div>
  )
}
