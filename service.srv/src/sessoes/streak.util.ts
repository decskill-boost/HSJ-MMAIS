const LISBON_TIMEZONE = 'Europe/Lisbon';
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const lisbonDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: LISBON_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Calendar date (YYYY-MM-DD) that `date` falls on in Europe/Lisbon time. */
export function toLisbonDateKey(date: Date): string {
  return lisbonDateFormatter.format(date);
}

/** Whole calendar days between the Lisbon dates of `from` and `to` (positive if `to` is later). */
export function diffInCalendarDays(from: Date, to: Date): number {
  const fromMs = Date.parse(`${toLisbonDateKey(from)}T00:00:00Z`);
  const toMs = Date.parse(`${toLisbonDateKey(to)}T00:00:00Z`);
  return Math.round((toMs - fromMs) / MS_PER_DAY);
}

export interface StreakState {
  streakAtual: number;
  ultimaAtividade: Date | null;
}

export interface StreakUpdateResult {
  streakAtual: number;
  ultimaAtividade: Date;
  changed: boolean;
}

export function computeStreakUpdate(current: StreakState, now: Date): StreakUpdateResult {
  if (!current.ultimaAtividade) {
    return { streakAtual: 1, ultimaAtividade: now, changed: true };
  }

  const gap = diffInCalendarDays(current.ultimaAtividade, now);

  if (gap <= 0) {
    return { streakAtual: current.streakAtual, ultimaAtividade: current.ultimaAtividade, changed: false };
  }
  if (gap === 1) {
    return { streakAtual: current.streakAtual + 1, ultimaAtividade: now, changed: true };
  }
  return { streakAtual: 1, ultimaAtividade: now, changed: true };
}

/** Streak value as it should be displayed "now", accounting for a gap that hasn't triggered a write yet. */
export function getEffectiveStreak(
  streakAtual: number,
  ultimaAtividade: Date | null,
  now: Date,
): number {
  if (!ultimaAtividade) return 0;
  return diffInCalendarDays(ultimaAtividade, now) <= 1 ? streakAtual : 0;
}
