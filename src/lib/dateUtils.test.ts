import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { toDateStr, todayStr, getWeekDates, addDaysStr, mondayOf } from './dateUtils'

describe('toDateStr', () => {
  it('pads month and day', () => {
    expect(toDateStr(new Date(2026, 0, 5))).toBe('2026-01-05')
  })

  it('uses local date components', () => {
    expect(toDateStr(new Date(2026, 11, 31, 23, 59))).toBe('2026-12-31')
  })
})

describe('todayStr around midnight (the shipped UTC bug)', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('rolls over at local midnight, not UTC', () => {
    // 12:35am local on July 2nd — under AEST this is still July 1st in UTC,
    // which is exactly the bug that shipped in fa96bef's predecessor.
    vi.setSystemTime(new Date(2026, 6, 2, 0, 35))
    expect(todayStr()).toBe('2026-07-02')
  })

  it('is stable just before midnight', () => {
    vi.setSystemTime(new Date(2026, 6, 2, 23, 59))
    expect(todayStr()).toBe('2026-07-02')
  })
})

describe('getWeekDates', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('returns Monday-to-Sunday containing today', () => {
    vi.setSystemTime(new Date(2026, 6, 1)) // Wed 1 Jul 2026
    expect(getWeekDates()).toEqual([
      '2026-06-29',
      '2026-06-30',
      '2026-07-01',
      '2026-07-02',
      '2026-07-03',
      '2026-07-04',
      '2026-07-05',
    ])
  })

  it('starts Monday when today is Sunday', () => {
    vi.setSystemTime(new Date(2026, 6, 5)) // Sun 5 Jul 2026
    expect(getWeekDates()[0]).toBe('2026-06-29')
    expect(getWeekDates()[6]).toBe('2026-07-05')
  })

  it('crosses a year boundary', () => {
    vi.setSystemTime(new Date(2027, 0, 1)) // Fri 1 Jan 2027
    expect(getWeekDates()[0]).toBe('2026-12-28')
  })

  it('accepts an anchor date for past weeks (WeekStrip paging)', () => {
    expect(getWeekDates('2026-06-22')).toEqual([
      '2026-06-22',
      '2026-06-23',
      '2026-06-24',
      '2026-06-25',
      '2026-06-26',
      '2026-06-27',
      '2026-06-28',
    ])
  })
})

describe('addDaysStr / mondayOf (Sydney DST)', () => {
  it('steps across spring-forward (2026-10-04, 23h day)', () => {
    expect(addDaysStr('2026-10-03', 1)).toBe('2026-10-04')
    expect(addDaysStr('2026-10-04', 1)).toBe('2026-10-05')
    expect(addDaysStr('2026-10-05', -1)).toBe('2026-10-04')
  })

  it('steps across fall-back (2026-04-05, 25h day)', () => {
    expect(addDaysStr('2026-04-04', 1)).toBe('2026-04-05')
    expect(addDaysStr('2026-04-05', 1)).toBe('2026-04-06')
  })

  it('steps a whole week back', () => {
    expect(addDaysStr('2026-07-06', -7)).toBe('2026-06-29')
  })

  it('finds Monday across DST and month boundaries', () => {
    expect(mondayOf('2026-10-04')).toBe('2026-09-28') // Sun in DST-switch week
    expect(mondayOf('2026-07-01')).toBe('2026-06-29')
    expect(mondayOf('2026-06-29')).toBe('2026-06-29') // Monday is its own Monday
  })
})
