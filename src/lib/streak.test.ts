import { describe, it, expect } from 'vitest'
import { computeStreak } from './streak'

const TODAY = '2026-07-02'

describe('computeStreak', () => {
  it('empty history', () => {
    expect(computeStreak([], TODAY)).toEqual({ current: 0, best: 0 })
  })

  it('today only', () => {
    expect(computeStreak(['2026-07-02'], TODAY)).toEqual({ current: 1, best: 1 })
  })

  it('anchors on yesterday when today has no session yet', () => {
    expect(computeStreak(['2026-07-01', '2026-06-30'], TODAY)).toEqual({
      current: 2,
      best: 2,
    })
  })

  it('streak broken when last activity was 2+ days ago', () => {
    const r = computeStreak(['2026-06-30', '2026-06-29', '2026-06-28'], TODAY)
    expect(r.current).toBe(0)
    expect(r.best).toBe(3)
  })

  it('unbroken run ending today', () => {
    expect(
      computeStreak(
        ['2026-07-02', '2026-07-01', '2026-06-30', '2026-06-29', '2026-06-28'],
        TODAY,
      ),
    ).toEqual({ current: 5, best: 5 })
  })

  it('gap resets current but best remembers the longer past run', () => {
    const past = ['2026-06-01', '2026-06-02', '2026-06-03', '2026-06-04', '2026-06-05', '2026-06-06', '2026-06-07']
    const recent = ['2026-07-01', '2026-07-02']
    const r = computeStreak([...past, ...recent], TODAY)
    expect(r.current).toBe(2)
    expect(r.best).toBe(7)
  })

  it('tolerates duplicates and unsorted input', () => {
    const r = computeStreak(
      ['2026-07-01', '2026-07-02', '2026-07-02', '2026-06-30', '2026-07-01'],
      TODAY,
    )
    expect(r).toEqual({ current: 3, best: 3 })
  })

  it('crosses a month boundary', () => {
    expect(
      computeStreak(['2026-07-02', '2026-07-01', '2026-06-30'], TODAY),
    ).toEqual({ current: 3, best: 3 })
  })

  it('survives the Sydney DST spring-forward (23-hour day)', () => {
    // Clocks jump forward Sun 2026-10-04 in Australia/Sydney (vitest env TZ).
    // Oct 3 → Oct 4 is only 23 hours; naive ms/86400000 === 1 comparisons break.
    const r = computeStreak(
      ['2026-10-03', '2026-10-04', '2026-10-05'],
      '2026-10-05',
    )
    expect(r).toEqual({ current: 3, best: 3 })
  })

  it('survives the Sydney DST fall-back (25-hour day)', () => {
    // Clocks fall back Sun 2026-04-05 in Australia/Sydney.
    const r = computeStreak(
      ['2026-04-04', '2026-04-05', '2026-04-06'],
      '2026-04-06',
    )
    expect(r).toEqual({ current: 3, best: 3 })
  })
})
