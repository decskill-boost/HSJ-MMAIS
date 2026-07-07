import {
  computeStreakUpdate,
  diffInCalendarDays,
  endOfLisbonDay,
  getEffectiveStreak,
  startOfLisbonDay,
  toLisbonDateKey,
} from '../streak.util';

describe('toLisbonDateKey', () => {
  it('formats a UTC instant as its Europe/Lisbon calendar date', () => {
    // Winter (WET, UTC+0): local date matches the UTC date.
    expect(toLisbonDateKey(new Date('2026-01-15T23:30:00Z'))).toBe('2026-01-15');
  });

  it('accounts for DST when the UTC and Lisbon calendar dates differ', () => {
    // Summer (WEST, UTC+1): 23:30 UTC is already past midnight in Lisbon.
    expect(toLisbonDateKey(new Date('2026-07-15T23:30:00Z'))).toBe('2026-07-16');
  });
});

describe('diffInCalendarDays', () => {
  it('is 0 for two instants on the same Lisbon calendar day', () => {
    const morning = new Date('2026-01-15T08:00:00Z');
    const night = new Date('2026-01-15T22:00:00Z');
    expect(diffInCalendarDays(morning, night)).toBe(0);
  });

  it('is 1 for consecutive Lisbon calendar days', () => {
    const day1 = new Date('2026-01-15T23:50:00Z');
    const day2 = new Date('2026-01-16T00:10:00Z');
    expect(diffInCalendarDays(day1, day2)).toBe(1);
  });

  it('correctly spans a DST transition (24h apart in UTC, 2 Lisbon calendar days apart)', () => {
    // 2024-03-31 01:00 UTC is when Portugal springs forward from WET (UTC+0) to WEST (UTC+1).
    const beforeTransition = new Date('2024-03-30T23:30:00Z'); // Lisbon: 2024-03-30
    const afterTransition = new Date('2024-03-31T23:30:00Z'); // Lisbon: 2024-04-01
    expect(diffInCalendarDays(beforeTransition, afterTransition)).toBe(2);
  });
});

describe('startOfLisbonDay / endOfLisbonDay', () => {
  it('returns UTC midnight in winter (WET, UTC+0)', () => {
    const date = new Date('2026-01-15T10:00:00Z');
    expect(startOfLisbonDay(date).toISOString()).toBe('2026-01-15T00:00:00.000Z');
    expect(endOfLisbonDay(date).toISOString()).toBe('2026-01-16T00:00:00.000Z');
  });

  it('returns 23:00 UTC the previous day in summer (WEST, UTC+1)', () => {
    // Lisbon midnight on 2026-07-16 is 23:00 UTC on 2026-07-15.
    const date = new Date('2026-07-15T23:30:00Z'); // already Lisbon 2026-07-16 00:30
    expect(startOfLisbonDay(date).toISOString()).toBe('2026-07-15T23:00:00.000Z');
    expect(endOfLisbonDay(date).toISOString()).toBe('2026-07-16T23:00:00.000Z');
  });

  it('agrees with toLisbonDateKey: a session just inside the bounds keys to the same day, just outside keys to a different day', () => {
    const date = new Date('2026-07-15T23:30:00Z');
    const key = toLisbonDateKey(date);
    const start = startOfLisbonDay(date);
    const end = endOfLisbonDay(date);

    expect(toLisbonDateKey(start)).toBe(key);
    expect(toLisbonDateKey(new Date(end.getTime() - 1))).toBe(key);
    expect(toLisbonDateKey(end)).not.toBe(key);
  });
});

describe('computeStreakUpdate', () => {
  it('starts the streak at 1 on the very first activity', () => {
    const now = new Date('2026-01-15T10:00:00Z');
    const result = computeStreakUpdate({ streakAtual: 0, ultimaAtividade: null }, now);
    expect(result).toEqual({ streakAtual: 1, ultimaAtividade: now, changed: true });
  });

  it('is a no-op for a second activity on the same Lisbon day', () => {
    const lastActivity = new Date('2026-01-15T08:00:00Z');
    const now = new Date('2026-01-15T20:00:00Z');
    const result = computeStreakUpdate({ streakAtual: 3, ultimaAtividade: lastActivity }, now);
    expect(result).toEqual({ streakAtual: 3, ultimaAtividade: lastActivity, changed: false });
  });

  it('increments the streak on the next consecutive day', () => {
    const lastActivity = new Date('2026-01-15T10:00:00Z');
    const now = new Date('2026-01-16T09:00:00Z');
    const result = computeStreakUpdate({ streakAtual: 3, ultimaAtividade: lastActivity }, now);
    expect(result).toEqual({ streakAtual: 4, ultimaAtividade: now, changed: true });
  });

  it('resets to 1 after a multi-day gap', () => {
    const lastActivity = new Date('2026-01-10T10:00:00Z');
    const now = new Date('2026-01-15T10:00:00Z');
    const result = computeStreakUpdate({ streakAtual: 10, ultimaAtividade: lastActivity }, now);
    expect(result).toEqual({ streakAtual: 1, ultimaAtividade: now, changed: true });
  });
});

describe('getEffectiveStreak', () => {
  it('is 0 when there has never been any activity', () => {
    expect(getEffectiveStreak(0, null, new Date('2026-01-15T10:00:00Z'))).toBe(0);
  });

  it('returns the stored value when the last activity was today', () => {
    const lastActivity = new Date('2026-01-15T08:00:00Z');
    const now = new Date('2026-01-15T20:00:00Z');
    expect(getEffectiveStreak(5, lastActivity, now)).toBe(5);
  });

  it('returns the stored value when the last activity was yesterday (grace window)', () => {
    const lastActivity = new Date('2026-01-14T10:00:00Z');
    const now = new Date('2026-01-15T09:00:00Z');
    expect(getEffectiveStreak(5, lastActivity, now)).toBe(5);
  });

  it('decays to 0 once a full day has passed with no activity', () => {
    const lastActivity = new Date('2026-01-13T10:00:00Z');
    const now = new Date('2026-01-15T09:00:00Z');
    expect(getEffectiveStreak(5, lastActivity, now)).toBe(0);
  });
});
