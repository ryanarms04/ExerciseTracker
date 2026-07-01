import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { toDateStr, todayStr, getWeekDates } from './dateUtils'

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
})
