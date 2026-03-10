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

// Mirrors the click-guard in settings.js:
// a card click is ignored if exhausted OR if clicking the current pet
function shouldAllowSelection(cardType, currentType, usedCount) {
  if (!canChange(usedCount)) return false;
  if (cardType === currentType) return false;
  return true;
}

// Mirrors confirm-button visibility logic:
// visible only when a valid (non-current, non-null) type is selected
function shouldShowConfirmButton(selectedType, currentType, usedCount) {
  if (!selectedType) return false;
  if (selectedType === currentType) return false;
  if (!canChange(usedCount)) return false;
  return true;
}

// After a successful switch, state is reset
function resetSelectionState() {
  return { selectedType: null, confirmVisible: false };
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

  test('1 left after 2 changes', () => {
    expect(usesLeft(2)).toBe(1);
  });

  test('0 left when limit reached', () => {
    expect(usesLeft(3)).toBe(0);
  });

  test('never goes negative', () => {
    expect(usesLeft(99)).toBe(0);
  });
});

// ─── shouldAllowSelection ─────────────────────────────────────────────────────
// This covers the bug: clicking current animal or when exhausted must be blocked.

describe('shouldAllowSelection', () => {
  test('allows selecting a different animal', () => {
    expect(shouldAllowSelection('cat', 'rabbit', 0)).toBe(true);
  });

  test('blocks selecting the current animal', () => {
    expect(shouldAllowSelection('rabbit', 'rabbit', 0)).toBe(false);
  });

  test('blocks any selection when limit is exhausted', () => {
    expect(shouldAllowSelection('cat',    'rabbit', 3)).toBe(false);
    expect(shouldAllowSelection('dog',    'rabbit', 3)).toBe(false);
    expect(shouldAllowSelection('parrot', 'rabbit', 3)).toBe(false);
  });

  test('blocks selecting current animal even with changes remaining', () => {
    expect(shouldAllowSelection('dog', 'dog', 1)).toBe(false);
    expect(shouldAllowSelection('dog', 'dog', 2)).toBe(false);
  });

  test('allows all non-current animals when changes remain', () => {
    const current = 'rabbit';
    ['cat', 'dog', 'parrot'].forEach(type => {
      expect(shouldAllowSelection(type, current, 0)).toBe(true);
    });
  });
});

// ─── shouldShowConfirmButton ──────────────────────────────────────────────────
// This covers the bug: button must be hidden when nothing valid is selected
// and must not remain visible after a switch is completed.

describe('shouldShowConfirmButton', () => {
  test('hidden when no animal is selected', () => {
    expect(shouldShowConfirmButton(null, 'rabbit', 0)).toBe(false);
  });

  test('visible when a different animal is selected', () => {
    expect(shouldShowConfirmButton('cat', 'rabbit', 0)).toBe(true);
  });

  test('hidden when selected type equals current type', () => {
    expect(shouldShowConfirmButton('rabbit', 'rabbit', 0)).toBe(false);
  });

  test('hidden when limit is exhausted even if something is selected', () => {
    expect(shouldShowConfirmButton('cat', 'rabbit', 3)).toBe(false);
  });

  test('hidden immediately after reset (simulates post-switch state)', () => {
    const { selectedType, confirmVisible } = resetSelectionState();
    expect(selectedType).toBeNull();
    expect(confirmVisible).toBe(false);
    expect(shouldShowConfirmButton(selectedType, 'cat', 1)).toBe(false);
  });
});

// ─── resetSelectionState ─────────────────────────────────────────────────────

describe('resetSelectionState', () => {
  test('returns null selectedType and hidden confirm button', () => {
    const state = resetSelectionState();
    expect(state.selectedType).toBeNull();
    expect(state.confirmVisible).toBe(false);
  });

  test('calling reset twice returns same clean state', () => {
    expect(resetSelectionState()).toEqual(resetSelectionState());
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

  test('full switch flow: apply → reset state → confirm hidden', () => {
    const updated = applyCompanionChange(basePet, 'cat');
    const state   = resetSelectionState();
    // After switch, new current is 'cat', button is hidden, nothing selected
    expect(updated.petType).toBe('cat');
    expect(shouldShowConfirmButton(state.selectedType, updated.petType, 1)).toBe(false);
  });
});
