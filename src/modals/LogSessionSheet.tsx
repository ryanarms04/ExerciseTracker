import { useState, useEffect, useRef, useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { motion, AnimatePresence, useAnimation } from 'motion/react'
import { RotateCcw } from 'lucide-react'
import { Sheet } from '../components/ui/Sheet'
import { DateChip } from '../components/ui/DateChip'
import { ExerciseCarousel } from '../components/exercise/ExerciseCarousel'
import { WeekStrip } from '../components/navigation/WeekStrip'
import { CircularDial } from '../components/counter/CircularDial'
import { useSnackbar } from '../components/ui/Snackbar'
import { db } from '../db/database'
import { useHaptic } from '../hooks/useHaptic'
import { todayStr, formatDate, relativeAge } from '../lib/dateUtils'
import type { Exercise, Session } from '../types'

const DIAL_SIZE = 280

interface LogSessionSheetProps {
  open: boolean
  onClose: () => void
  /** Exercise armed on open (tile, library, detail, or LoggerHost's last-used). */
  initialExercise?: Exercise | null
  /** Date the user was viewing when they opened the logger. Defaults to today. */
  initialDate?: string
  /** Set = edit this session: dial preloaded, date and exercise locked. */
  editSession?: Session | null
}

export function LogSessionSheet({
  open,
  onClose,
  initialExercise,
  initialDate,
  editSession,
}: LogSessionSheetProps) {
  const [count, setCount] = useState(0)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [selectedDate, setSelectedDate] = useState(todayStr())
  const [showPicker, setShowPicker] = useState(false)
  const wasOpen = useRef(false)

  const controls = useAnimation()
  const rippleControls = useAnimation()
  const haptic = useHaptic()
  const snackbar = useSnackbar()

  // Fresh state on each open transition only — mid-session liveQuery identity
  // churn must not reset the dial.
  useEffect(() => {
    if (open && !wasOpen.current) {
      setCount(editSession?.reps ?? 0)
      setSelectedId(editSession?.exerciseId ?? initialExercise?.id ?? null)
      setSelectedDate(editSession?.date ?? initialDate ?? todayStr())
      setShowPicker(false)
    }
    wasOpen.current = open
  }, [open, editSession, initialExercise, initialDate])

  const activeExercises = useLiveQuery(async () => {
    const all = await db.exercises.toArray()
    return all.filter((e) => !e.isArchived)
  }, [])

  // An edited session may belong to an archived exercise — keep it pickable
  const carouselList = (() => {
    const list = activeExercises ?? []
    if (selectedId != null && !list.some((e) => e.id === selectedId) && initialExercise?.id === selectedId) {
      return [...list, initialExercise]
    }
    return list
  })()

  const selected = carouselList.find((e) => e.id === selectedId) ?? carouselList[0]

  const increment = useCallback(() => {
    setCount((c) => c + 1)
    haptic.tick()
    controls.start({
      scale: [1, 1.15, 1],
      transition: { duration: 0.3, ease: [0.34, 1.56, 0.64, 1] },
    })
    rippleControls.set({ scale: 0.8, opacity: 0.5 })
    rippleControls.start({ scale: 2.4, opacity: 0, transition: { duration: 0.6 } })
  }, [controls, rippleControls, haptic])

  const decrement = useCallback(() => {
    setCount((c) => Math.max(0, c - 1))
    haptic.tick()
  }, [haptic])

  const adjust = useCallback(
    (n: number) => {
      setCount((c) => Math.max(0, c + n))
      haptic.tick()
      controls.start({
        scale: [1, 1.1, 1],
        transition: { duration: 0.25, ease: [0.34, 1.56, 0.64, 1] },
      })
    },
    [controls, haptic],
  )

  function switchExercise(ex: Exercise) {
    if (ex.id === selectedId) return
    if (count > 0) {
      const ok = window.confirm(
        `Discard ${count} uncounted reps and switch to ${ex.name}?`,
      )
      if (!ok) return
      setCount(0)
    }
    setSelectedId(ex.id!)
  }

  // Abandon guard: uncounted reps (or unsaved edits) need one deliberate step
  function handleClose() {
    const dirty = editSession ? count !== editSession.reps : count > 0
    if (dirty) {
      const msg = editSession
        ? 'Discard changes to this set?'
        : `Discard ${count} uncounted reps?`
      if (!window.confirm(msg)) return
    }
    onClose()
  }

  async function handleBank() {
    if (!selected?.id || count === 0) return
    haptic.success()

    if (editSession?.id) {
      const sessionId = editSession.id
      const original = editSession.reps
      const updated = count
      await db.sessions.update(sessionId, { reps: updated })
      onClose()
      snackbar.show({
        message: `Updated ${selected.name} to ${updated}`,
        actionLabel: 'Undo',
        onAction: () => db.sessions.update(sessionId, { reps: original }),
      })
      return
    }

    const banked = count
    const date = selectedDate
    const id = (await db.sessions.add({
      exerciseId: selected.id,
      reps: banked,
      date,
      createdAt: new Date().toISOString(),
    })) as number
    const daySessions = await db.sessions.where('date').equals(date).toArray()
    const dayTotal = daySessions.reduce((sum, s) => sum + s.reps, 0)
    onClose()
    snackbar.show({
      message: `Banked ${banked} · ${dayTotal} ${date === todayStr() ? 'today' : `on ${formatDate(date)}`}`,
      actionLabel: 'Undo',
      onAction: () => db.sessions.delete(id),
    })
  }

  function handleDialKeys(e: React.KeyboardEvent) {
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
      e.preventDefault()
      increment()
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
      e.preventDefault()
      decrement()
    }
  }

  const chip =
    'min-h-11 px-3 rounded-full type-label bg-surface-2 border border-hairline text-text-mute transition-colors disabled:opacity-30'

  return (
    <Sheet
      open={open}
      onClose={handleClose}
      headerRight={
        <DateChip
          date={selectedDate}
          onTap={editSession ? undefined : () => setShowPicker((v) => !v)}
          expanded={showPicker}
        />
      }
    >
      {selected && (
        <div className="max-w-sm mx-auto flex flex-col items-center gap-5 no-select">
          <AnimatePresence>
            {showPicker && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="w-full overflow-hidden"
              >
                <WeekStrip
                  selectedDate={selectedDate}
                  onSelect={(d) => {
                    setSelectedDate(d)
                    setShowPicker(false)
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <ExerciseCarousel
            exercises={carouselList}
            selectedId={selected.id ?? null}
            onSelect={switchExercise}
            locked={!!editSession}
          />

          <ContextStrip exerciseId={selected.id!} date={selectedDate} />

          <div
            role="slider"
            tabIndex={0}
            aria-label={`Rep dial for ${selected.name}`}
            aria-valuemin={0}
            aria-valuemax={999}
            aria-valuenow={count}
            aria-valuetext={`${count} reps`}
            onKeyDown={handleDialKeys}
            className="relative flex items-center justify-center rounded-full outline-offset-8"
            style={{ width: DIAL_SIZE, height: DIAL_SIZE }}
          >
            <CircularDial
              size={DIAL_SIZE}
              strokeWidth={8}
              count={count}
              onIncrement={increment}
              onDecrement={decrement}
              color={selected.color}
            />
            <motion.div
              animate={rippleControls}
              className="absolute w-24 h-24 rounded-full border-2 border-accent-bright pointer-events-none"
              style={{ opacity: 0 }}
            />
            {/* The whole inner circle is the +1 target — bigger than any button */}
            <button
              onClick={increment}
              aria-label="Add one rep"
              className="absolute w-48 h-48 rounded-full flex items-center justify-center z-10"
            >
              <motion.span animate={controls} className="num-hero text-text">
                {count}
              </motion.span>
            </button>
            <span className="sr-only" role="status" aria-live="polite">
              {count} reps
            </span>
          </div>

          <p className="type-caption text-text-faint -mt-2">
            Spin the ring · tap the middle for +1
          </p>

          <div className="flex items-center justify-center gap-1.5 flex-wrap">
            <button className={chip} disabled={count === 0} onClick={() => adjust(-10)}>
              −10
            </button>
            <button className={chip} disabled={count === 0} onClick={() => adjust(-5)}>
              −5
            </button>
            <button
              className={`${chip} w-11 px-0 flex items-center justify-center`}
              disabled={count === 0}
              onClick={() => {
                setCount(0)
                haptic.tick()
              }}
              aria-label="Reset count"
            >
              <RotateCcw size={15} />
            </button>
            <button className={chip} onClick={() => adjust(5)}>
              +5
            </button>
            <button className={chip} onClick={() => adjust(10)}>
              +10
            </button>
            <button className={chip} onClick={() => adjust(25)}>
              +25
            </button>
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            disabled={count === 0}
            onClick={handleBank}
            className="w-full min-h-14 rounded-2xl bg-accent text-accent-ink type-heading disabled:opacity-40 transition-opacity"
          >
            {editSession
              ? `Update to ${count}`
              : count > 0
                ? `Bank ${count} ${selected.name.toLowerCase()}`
                : `Bank ${selected.name.toLowerCase()}`}
          </motion.button>
        </div>
      )}
    </Sheet>
  )
}

/** Today {n} · Last {reps} ({age}) · Best {n} — the numbers you size a set against. */
function ContextStrip({ exerciseId, date }: { exerciseId: number; date: string }) {
  const stats = useLiveQuery(async () => {
    const sessions = await db.sessions.where('exerciseId').equals(exerciseId).toArray()
    const dayTotal = sessions
      .filter((s) => s.date === date)
      .reduce((sum, s) => sum + s.reps, 0)
    let last: Session | undefined
    for (const s of sessions) {
      if (!last || s.createdAt > last.createdAt) last = s
    }
    const byDate = new Map<string, number>()
    for (const s of sessions) {
      byDate.set(s.date, (byDate.get(s.date) ?? 0) + s.reps)
    }
    const best = byDate.size > 0 ? Math.max(...byDate.values()) : 0
    return { dayTotal, last, best }
  }, [exerciseId, date])

  const isToday = date === todayStr()

  return (
    <p className="type-caption text-text-faint flex items-center gap-1.5 flex-wrap justify-center">
      <span>
        {isToday ? 'Today' : 'This day'}{' '}
        <span className="num-sm text-text-mute">{stats?.dayTotal ?? 0}</span>
      </span>
      <span aria-hidden>·</span>
      <span>
        Last{' '}
        <span className="num-sm text-text-mute">{stats?.last?.reps ?? '—'}</span>
        {stats?.last && ` (${relativeAge(stats.last.createdAt)})`}
      </span>
      <span aria-hidden>·</span>
      <span>
        Best <span className="num-sm text-text-mute">{stats?.best || '—'}</span>
      </span>
    </p>
  )
}
