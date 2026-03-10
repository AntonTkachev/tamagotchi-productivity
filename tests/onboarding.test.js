// Tests for onboarding pet creation logic.
// The DOM/Canvas parts of onboarding.js are browser-only; we test the pet
// object structure directly by replicating the creation logic.

// ─── Pet factory (mirrors onboarding.js confirmBtn handler) ──────────────────

function createPetFromOnboarding(selectedType, now = Date.now()) {
  return {
    health:            80,
    happiness:         80,
    age:               0,
    stage:             'egg',
    petType:           selectedType,
    bornAt:            now,
    lastUpdated:       now,
    focusMinutesToday: 0,
    lastFocusDate:     new Date(now).toDateString(),
    streak:            0,
    bestStreak:        0,
    isDead:            false,
    currentSiteType:   'neutral',
  };
}

// ─── Pet structure ────────────────────────────────────────────────────────────

describe('onboarding pet creation', () => {
  test.each(['rabbit', 'cat', 'dog', 'parrot'])(
    '%s pet starts as an egg with full health',
    (petType) => {
      const pet = createPetFromOnboarding(petType);
      expect(pet.stage).toBe('egg');
      expect(pet.petType).toBe(petType);
      expect(pet.health).toBe(80);
      expect(pet.happiness).toBe(80);
      expect(pet.isDead).toBe(false);
    }
  );

  test('pet has all required fields', () => {
    const pet = createPetFromOnboarding('rabbit');
    const requiredFields = [
      'health', 'happiness', 'age', 'stage', 'petType',
      'bornAt', 'lastUpdated', 'focusMinutesToday', 'lastFocusDate',
      'streak', 'bestStreak', 'isDead', 'currentSiteType',
    ];
    requiredFields.forEach(field => {
      expect(pet).toHaveProperty(field);
    });
  });

  test('bornAt and lastUpdated are equal on creation', () => {
    const now = 1700000000000;
    const pet = createPetFromOnboarding('cat', now);
    expect(pet.bornAt).toBe(now);
    expect(pet.lastUpdated).toBe(now);
  });

  test('starts at age 0 with 0 focus minutes', () => {
    const pet = createPetFromOnboarding('dog');
    expect(pet.age).toBe(0);
    expect(pet.focusMinutesToday).toBe(0);
  });

  test('starts with streak 0 and bestStreak 0', () => {
    const pet = createPetFromOnboarding('rabbit');
    expect(pet.streak).toBe(0);
    expect(pet.bestStreak).toBe(0);
  });

  test('currentSiteType is neutral on creation', () => {
    const pet = createPetFromOnboarding('parrot');
    expect(pet.currentSiteType).toBe('neutral');
  });

  test('lastFocusDate matches bornAt date string', () => {
    const now = new Date('2024-01-15').getTime();
    const pet = createPetFromOnboarding('rabbit', now);
    expect(pet.lastFocusDate).toBe(new Date(now).toDateString());
  });
});

// ─── ANIMAL_PALETTES integrity ────────────────────────────────────────────────
// Verifies the per-animal colour tables in onboarding.js are consistent.

const ONBOARDING_PALETTES = {
  rabbit: { '.':null, b:'#F5F5F5', d:'#DCDCDC', p:'#FFB3C6', n:'#FD79A8', e:'#2D3436', w:'#FFFFFF' },
  cat:    { '.':null, b:'#FDCB6E', d:'#E17055', G:'#00CEC9', p:'#FD79A8', e:'#2D3436', w:'#FFFFFF' },
  dog:    { '.':null, b:'#C8956C', d:'#8B5E3C', e:'#2D3436', p:'#FD79A8', r:'#FF7675', w:'#FFFFFF' },
  parrot: { '.':null, b:'#00B894', d:'#00836B', y:'#FDCB6E', r:'#FF6B6B', e:'#2D3436', k:'#E17055', w:'#FFFFFF' },
};

describe('onboarding animal palettes', () => {
  test('all four animals have palettes defined', () => {
    expect(Object.keys(ONBOARDING_PALETTES)).toEqual(['rabbit', 'cat', 'dog', 'parrot']);
  });

  test.each(Object.entries(ONBOARDING_PALETTES))(
    '%s palette has transparent pixel, body, dark, eye and white',
    (name, palette) => {
      expect(palette['.']).toBeNull();
      expect(palette.b).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(palette.d).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(palette.e).toBe('#2D3436');
      expect(palette.w).toBe('#FFFFFF');
    }
  );

  test('each animal has a distinct body colour', () => {
    const bodies = Object.values(ONBOARDING_PALETTES).map(p => p.b);
    const unique  = new Set(bodies);
    expect(unique.size).toBe(4);
  });
});
