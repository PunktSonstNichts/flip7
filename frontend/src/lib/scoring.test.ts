import { describe, expect, it } from 'vitest'
import { emptyEntry, hasFlip7, scoreEntry, winnersFor, withScore } from './scoring'

describe('scoreEntry', () => {
  it('scores 0 when busted, even with cards', () => {
    expect(
      scoreEntry({
        ...emptyEntry('p1'),
        busted: true,
        numberCards: [12, 11, 10],
        hasDouble: true,
        bonuses: [10],
      }),
    ).toBe(0)
  })

  it('sums number cards, then doubles, then adds bonuses', () => {
    expect(
      scoreEntry({
        ...emptyEntry('p1'),
        numberCards: [1, 2, 3],
        hasDouble: true,
        bonuses: [4, 10],
      }),
    ).toBe(26)
  })

  it('does not let x2 double bonuses or the Flip 7 bonus', () => {
    expect(
      scoreEntry({
        ...emptyEntry('p1'),
        numberCards: [0, 1, 2, 3, 4, 5, 6],
        hasDouble: true,
        bonuses: [10],
      }),
    ).toBe(21 * 2 + 10 + 15)
  })

  it('adds +15 only for exactly seven unique number cards', () => {
    expect(
      scoreEntry({
        ...emptyEntry('p1'),
        numberCards: [1, 2, 3, 4, 5, 6],
      }),
    ).toBe(21)
    expect(
      scoreEntry({
        ...emptyEntry('p1'),
        numberCards: [1, 2, 3, 4, 5, 6, 7],
      }),
    ).toBe(28 + 15)
  })

  it('deduplicates number cards before scoring', () => {
    expect(withScore({ ...emptyEntry('p1'), numberCards: [5, 5, 7] }).score).toBe(12)
  })
})

describe('hasFlip7', () => {
  it('is true only for seven unique number cards that did not bust', () => {
    expect(hasFlip7({ ...emptyEntry('p1'), numberCards: [1, 2, 3, 4, 5, 6] })).toBe(false)
    expect(hasFlip7({ ...emptyEntry('p1'), numberCards: [1, 2, 3, 4, 5, 6, 7] })).toBe(true)
    expect(
      hasFlip7({ ...emptyEntry('p1'), busted: true, numberCards: [1, 2, 3, 4, 5, 6, 7] }),
    ).toBe(false)
  })
})

describe('winnersFor', () => {
  it('returns a single winner at or over the target', () => {
    expect(winnersFor({ a: 210, b: 180 }, 200)).toEqual(['a'])
  })

  it('returns no winner on a tie over the target', () => {
    expect(winnersFor({ a: 210, b: 210 }, 200)).toEqual([])
  })
})
