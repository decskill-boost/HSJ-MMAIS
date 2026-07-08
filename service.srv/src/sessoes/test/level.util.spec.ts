import { calculateLevelProgress, cumulativeXpForLevel } from '../level.util';

describe('cumulativeXpForLevel', () => {
  it('is 0 at level 1', () => {
    expect(cumulativeXpForLevel(1)).toBe(0);
  });

  it('follows the triangular curve for later levels', () => {
    expect(cumulativeXpForLevel(2)).toBe(100);
    expect(cumulativeXpForLevel(3)).toBe(300);
    expect(cumulativeXpForLevel(4)).toBe(600);
  });
});

describe('calculateLevelProgress', () => {
  it('starts at level 1 with 0 xp', () => {
    const result = calculateLevelProgress(0);
    expect(result.level).toBe(1);
    expect(result.xpForNextLevel).toBe(100);
    expect(result.progressToNextLevel).toBe(0);
  });

  it('stays at the current level just below a threshold', () => {
    const result = calculateLevelProgress(99);
    expect(result.level).toBe(1);
  });

  it('levels up exactly on a threshold', () => {
    const result = calculateLevelProgress(100);
    expect(result.level).toBe(2);
    expect(result.progressToNextLevel).toBe(0);
  });

  it('jumps multiple levels from one large reward', () => {
    const result = calculateLevelProgress(650);
    expect(result.level).toBe(4);
    expect(result.xpForNextLevel).toBe(1000);
    expect(result.progressToNextLevel).toBeCloseTo((650 - 600) / (1000 - 600));
  });
});
