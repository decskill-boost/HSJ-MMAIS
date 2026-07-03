const XP_PER_LEVEL_STEP = 100;

/** Cumulative XP required to reach `level` (level 1 = 0 XP). */
export function cumulativeXpForLevel(level: number): number {
  if (level <= 1) return 0;
  return (XP_PER_LEVEL_STEP * (level - 1) * level) / 2;
}

export interface LevelProgress {
  level: number;
  xpForNextLevel: number;
  progressToNextLevel: number;
}

export function calculateLevelProgress(totalXp: number): LevelProgress {
  let level = 1;
  while (cumulativeXpForLevel(level + 1) <= totalXp) {
    level += 1;
  }

  const currentLevelXp = cumulativeXpForLevel(level);
  const xpForNextLevel = cumulativeXpForLevel(level + 1);
  const progressToNextLevel =
    (totalXp - currentLevelXp) / (xpForNextLevel - currentLevelXp);

  return { level, xpForNextLevel, progressToNextLevel };
}
