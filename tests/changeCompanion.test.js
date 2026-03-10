// Tests for "change companion" business logic.
// The UI layer (settings.js) is browser-only, so we inline the pure logic here.

const MAX_FREE_CHANGES = 3;

function canChange(usedCount) {
  return usedCount < MAX_FREE_CHANGES;
}

function usesLeft(usedCount) {
  return Math.max(0, MAX_FREE_CHANGES - usedCount);
}

function applyCompanionChange(pet, newType) {
  return { ...pet, petType: newType };
}

// ─── canChange ────────────────────────────────────────────────────────────────

describe('canChange', () => {
  test('allowed when 0 changes used', () => {
    expect(canChange(0)).toBe(true);
  });

  test('allowed when 1 change used', () => {
    expect(canChange(1)).toBe(true);
  });

  test('allowed when 2 changes used', () => {
    expect(canChange(2)).toBe(true);
  });

  test('not allowed when 3 changes used (limit reached)', () => {
    expect(canChange(3)).toBe(false);
  });

  test('not allowed beyond the limit', () => {
    expect(canChange(99)).toBe(false);
  });
});

// ─── usesLeft ─────────────────────────────────────────────────────────────────

describe('usesLeft', () => {
  test('3 left when none used', () => {
    expect(usesLeft(0)).toBe(3);
  });

  test('2 left after 1 change', () => {
    expect(usesLeft(1)).toBe(2);
  });

  test('0 left when limit reached', () => {
    expect(usesLeft(3)).toBe(0);
  });

  test('never goes negative', () => {
    expect(usesLeft(99)).toBe(0);
  });
});

// ─── applyCompanionChange ─────────────────────────────────────────────────────

describe('applyCompanionChange', () => {
  const basePet = {
    health: 75, happiness: 60, age: 10, stage: 'teen',
    streak: 5, bestStreak: 7, focusMinutesToday: 30,
    petType: 'rabbit', isDead: false,
  };

  test('updates petType to the new animal', () => {
    expect(applyCompanionChange(basePet, 'cat').petType).toBe('cat');
    expect(applyCompanionChange(basePet, 'dog').petType).toBe('dog');
    expect(applyCompanionChange(basePet, 'parrot').petType).toBe('parrot');
  });

  test('preserves health and happiness', () => {
    const updated = applyCompanionChange(basePet, 'cat');
    expect(updated.health).toBe(75);
    expect(updated.happiness).toBe(60);
  });

  test('preserves age and stage', () => {
    const updated = applyCompanionChange(basePet, 'dog');
    expect(updated.age).toBe(10);
    expect(updated.stage).toBe('teen');
  });

  test('preserves streak and bestStreak', () => {
    const updated = applyCompanionChange(basePet, 'parrot');
    expect(updated.streak).toBe(5);
    expect(updated.bestStreak).toBe(7);
  });

  test('preserves focus minutes', () => {
    const updated = applyCompanionChange(basePet, 'cat');
    expect(updated.focusMinutesToday).toBe(30);
  });

  test('does not mutate the original pet object', () => {
    applyCompanionChange(basePet, 'cat');
    expect(basePet.petType).toBe('rabbit');
  });
});
