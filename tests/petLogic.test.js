const {
  createDefaultPet,
  DEFAULT_SETTINGS,
  getStage,
  categorizeSite,
  computeStatUpdate,
  cleanHostname,
} = require('../petLogic');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DAY = 24 * 60 * 60 * 1000;
const MIN = 60 * 1000;

function makePet(overrides = {}) {
  return { ...createDefaultPet(), ...overrides };
}

function makeSettings(overrides = {}) {
  return {
    productive:  ['github.com', 'notion.so'],
    distracting: ['youtube.com', 'reddit.com'],
    ...overrides,
  };
}

// ─── getStage ─────────────────────────────────────────────────────────────────

describe('getStage', () => {
  test('returns "dead" when isDead=true regardless of age/health', () => {
    expect(getStage(0,   100, true)).toBe('dead');
    expect(getStage(30,  90,  true)).toBe('dead');
    expect(getStage(100, 0,   true)).toBe('dead');
  });

  test('egg for age < 3 days', () => {
    expect(getStage(0, 80, false)).toBe('egg');
    expect(getStage(2.9, 80, false)).toBe('egg');
  });

  test('baby for age 3–7 days with health > 20', () => {
    expect(getStage(3, 80, false)).toBe('baby');
    expect(getStage(7.9, 50, false)).toBe('baby');
  });

  test('stays egg at age 3–7 if health <= 20', () => {
    expect(getStage(5, 20, false)).toBe('egg');
    expect(getStage(5, 0, false)).toBe('egg');
  });

  test('teen for age 8–20 days with health > 30', () => {
    expect(getStage(8, 80, false)).toBe('teen');
    expect(getStage(20, 31, false)).toBe('teen');
  });

  test('regresses to baby at age 8–20 if health <= 30', () => {
    expect(getStage(10, 30, false)).toBe('baby');
  });

  test('adult for age 21–59 with health > 40', () => {
    expect(getStage(21, 80, false)).toBe('adult');
    expect(getStage(59, 41, false)).toBe('adult');
  });

  test('regresses to teen at age 21–59 if health <= 40', () => {
    expect(getStage(30, 40, false)).toBe('teen');
  });

  test('legend for age >= 60 with health > 60', () => {
    expect(getStage(60, 80, false)).toBe('legend');
    expect(getStage(200, 61, false)).toBe('legend');
  });

  test('stays adult at age >= 60 if health <= 60', () => {
    expect(getStage(60, 60, false)).toBe('adult');
    expect(getStage(100, 10, false)).toBe('adult');
  });
});

// ─── categorizeSite ───────────────────────────────────────────────────────────

describe('categorizeSite', () => {
  const NOW = Date.now();
  const RECENT = NOW - 2 * MIN; // 2 minutes ago — within 10-min window

  test('returns "neutral" for empty hostname', () => {
    expect(categorizeSite('', makeSettings(), RECENT, NOW)).toBe('neutral');
    expect(categorizeSite(null, makeSettings(), RECENT, NOW)).toBe('neutral');
  });

  test('returns "neutral" when site timestamp is stale (> 10 min)', () => {
    const stale = NOW - 11 * MIN;
    expect(categorizeSite('github.com', makeSettings(), stale, NOW)).toBe('neutral');
  });

  test('classifies a productive site', () => {
    expect(categorizeSite('github.com', makeSettings(), RECENT, NOW)).toBe('productive');
    expect(categorizeSite('gist.github.com', makeSettings(), RECENT, NOW)).toBe('productive');
  });

  test('classifies a distracting site', () => {
    expect(categorizeSite('youtube.com', makeSettings(), RECENT, NOW)).toBe('distracting');
    expect(categorizeSite('m.youtube.com', makeSettings(), RECENT, NOW)).toBe('distracting');
  });

  test('returns "neutral" for an uncategorised site', () => {
    expect(categorizeSite('wikipedia.org', makeSettings(), RECENT, NOW)).toBe('neutral');
  });

  test('productive takes precedence if somehow in both lists', () => {
    const both = makeSettings({ productive: ['example.com'], distracting: ['example.com'] });
    expect(categorizeSite('example.com', both, RECENT, NOW)).toBe('productive');
  });
});

// ─── computeStatUpdate ────────────────────────────────────────────────────────

describe('computeStatUpdate', () => {
  const SETTINGS = makeSettings();

  test('returns skipped=true and sets siteType=sleeping after 8+ hour absence', () => {
    const pet = makePet({ lastUpdated: Date.now() - 9 * 60 * 60 * 1000 });
    const { pet: updated, skipped } = computeStatUpdate(pet, SETTINGS, '', 0, Date.now());
    expect(skipped).toBe(true);
    expect(updated.currentSiteType).toBe('sleeping');
  });

  test('increases health and happiness on productive site', () => {
    const now  = Date.now();
    const pet  = makePet({ health: 50, happiness: 50, lastUpdated: now - 5 * MIN });
    const { pet: updated } = computeStatUpdate(pet, SETTINGS, 'github.com', now - 1 * MIN, now);
    expect(updated.health).toBe(52);
    expect(updated.happiness).toBe(51);
    expect(updated.focusMinutesToday).toBe(5);
  });

  test('decreases health and happiness on distracting site', () => {
    const now  = Date.now();
    const pet  = makePet({ health: 50, happiness: 50, lastUpdated: now - 5 * MIN });
    const { pet: updated } = computeStatUpdate(pet, SETTINGS, 'youtube.com', now - 1 * MIN, now);
    expect(updated.health).toBe(47);
    expect(updated.happiness).toBe(48);
  });

  test('gives small boost on neutral site (no bad sites open)', () => {
    const now  = Date.now();
    const pet  = makePet({ health: 50, happiness: 50, lastUpdated: now - 5 * MIN });
    const { pet: updated } = computeStatUpdate(pet, SETTINGS, 'wikipedia.org', now - 1 * MIN, now);
    expect(updated.health).toBeCloseTo(50.5);
    expect(updated.happiness).toBeCloseTo(50.3);
  });

  test('health is capped at 100', () => {
    const now = Date.now();
    const pet = makePet({ health: 99, happiness: 99, lastUpdated: now - 5 * MIN });
    const { pet: updated } = computeStatUpdate(pet, SETTINGS, 'github.com', now - 1 * MIN, now);
    expect(updated.health).toBe(100);
    expect(updated.happiness).toBe(100);
  });

  test('health cannot go below 0', () => {
    const now = Date.now();
    const pet = makePet({ health: 1, happiness: 1, lastUpdated: now - 5 * MIN });
    const { pet: updated } = computeStatUpdate(pet, SETTINGS, 'youtube.com', now - 1 * MIN, now);
    expect(updated.health).toBe(0);
    expect(updated.happiness).toBe(0);
    expect(updated.isDead).toBe(true);
  });

  test('pet dies when health reaches 0', () => {
    const now = Date.now();
    const pet = makePet({ health: 2, happiness: 5, lastUpdated: now - 5 * MIN });
    const { pet: updated } = computeStatUpdate(pet, SETTINGS, 'youtube.com', now - 1 * MIN, now);
    expect(updated.isDead).toBe(true);
    expect(updated.health).toBe(0);
  });

  test('dead pet revives on productive site with minimum health', () => {
    const now = Date.now();
    const pet = makePet({ health: 0, happiness: 0, isDead: true, lastUpdated: now - 5 * MIN });
    const { pet: updated } = computeStatUpdate(pet, SETTINGS, 'github.com', now - 1 * MIN, now);
    expect(updated.isDead).toBe(false);
    expect(updated.health).toBe(10);
    expect(updated.happiness).toBe(20);
  });

  test('dead pet stays dead on neutral site', () => {
    const now = Date.now();
    const pet = makePet({ health: 0, happiness: 0, isDead: true, lastUpdated: now - 5 * MIN });
    const { pet: updated } = computeStatUpdate(pet, SETTINGS, 'wikipedia.org', now - 1 * MIN, now);
    expect(updated.isDead).toBe(true);
  });

  test('resets daily focus counter on a new day', () => {
    const now = Date.now();
    const yesterday = new Date(now - DAY).toDateString();
    const pet = makePet({
      focusMinutesToday: 120,
      lastFocusDate: yesterday,
      lastUpdated: now - 5 * MIN,
    });
    const { pet: updated } = computeStatUpdate(pet, SETTINGS, 'github.com', now - 1 * MIN, now);
    expect(updated.focusMinutesToday).toBe(5); // reset to 0, then +5 for productive
    expect(updated.lastFocusDate).toBe(new Date(now).toDateString());
  });

  // ─── Streak ───────────────────────────────────────────────────────────────

  test('streak increments when previous day had focus minutes', () => {
    const now = Date.now();
    const yesterday = new Date(now - DAY).toDateString();
    const pet = makePet({
      streak: 2,
      focusMinutesToday: 30,
      lastFocusDate: yesterday,
      lastUpdated: now - 5 * MIN,
    });
    const { pet: updated } = computeStatUpdate(pet, SETTINGS, 'github.com', now - MIN, now);
    expect(updated.streak).toBe(3);
  });

  test('streak resets to 0 when previous day had no focus', () => {
    const now = Date.now();
    const yesterday = new Date(now - DAY).toDateString();
    const pet = makePet({
      streak: 5,
      focusMinutesToday: 0,
      lastFocusDate: yesterday,
      lastUpdated: now - 5 * MIN,
    });
    const { pet: updated } = computeStatUpdate(pet, SETTINGS, 'github.com', now - MIN, now);
    expect(updated.streak).toBe(0);
  });

  test('streak does not change within the same day', () => {
    const now = Date.now();
    const pet = makePet({
      streak: 4,
      focusMinutesToday: 60,
      lastFocusDate: new Date(now).toDateString(),
      lastUpdated: now - 5 * MIN,
    });
    const { pet: updated } = computeStatUpdate(pet, SETTINGS, 'github.com', now - MIN, now);
    expect(updated.streak).toBe(4);
  });

  test('bestStreak updates when streak exceeds previous best', () => {
    const now = Date.now();
    const yesterday = new Date(now - DAY).toDateString();
    const pet = makePet({
      streak: 9,
      bestStreak: 9,
      focusMinutesToday: 30,
      lastFocusDate: yesterday,
      lastUpdated: now - 5 * MIN,
    });
    const { pet: updated } = computeStatUpdate(pet, SETTINGS, 'github.com', now - MIN, now);
    expect(updated.streak).toBe(10);
    expect(updated.bestStreak).toBe(10);
  });

  test('bestStreak does not decrease when streak resets', () => {
    const now = Date.now();
    const yesterday = new Date(now - DAY).toDateString();
    const pet = makePet({
      streak: 7,
      bestStreak: 7,
      focusMinutesToday: 0,
      lastFocusDate: yesterday,
      lastUpdated: now - 5 * MIN,
    });
    const { pet: updated } = computeStatUpdate(pet, SETTINGS, 'github.com', now - MIN, now);
    expect(updated.streak).toBe(0);
    expect(updated.bestStreak).toBe(7);
  });

  test('updates age correctly', () => {
    const now     = Date.now();
    const bornAt  = now - 10 * DAY;
    const pet     = makePet({ bornAt, lastUpdated: now - 5 * MIN });
    const { pet: updated } = computeStatUpdate(pet, SETTINGS, '', 0, now);
    expect(updated.age).toBe(10);
  });

  test('stage advances with age and health', () => {
    const now    = Date.now();
    const bornAt = now - 5 * DAY; // 5 days old → baby
    const pet    = makePet({ bornAt, health: 80, lastUpdated: now - 5 * MIN });
    const { pet: updated } = computeStatUpdate(pet, SETTINGS, '', 0, now);
    expect(updated.stage).toBe('baby');
  });
});

// ─── cleanHostname ────────────────────────────────────────────────────────────

describe('cleanHostname', () => {
  test('strips https://', () => {
    expect(cleanHostname('https://github.com')).toBe('github.com');
  });

  test('strips http://', () => {
    expect(cleanHostname('http://example.com')).toBe('example.com');
  });

  test('strips path after hostname', () => {
    expect(cleanHostname('https://github.com/user/repo')).toBe('github.com');
  });

  test('lowercases the result', () => {
    expect(cleanHostname('GitHub.COM')).toBe('github.com');
  });

  test('trims whitespace', () => {
    expect(cleanHostname('  github.com  ')).toBe('github.com');
  });

  test('returns empty string for empty input', () => {
    expect(cleanHostname('')).toBe('');
    expect(cleanHostname(null)).toBe('');
    expect(cleanHostname(undefined)).toBe('');
  });

  test('handles bare hostname without protocol', () => {
    expect(cleanHostname('github.com')).toBe('github.com');
  });
});

// ─── createDefaultPet ─────────────────────────────────────────────────────────

describe('createDefaultPet', () => {
  test('creates a pet with full required fields', () => {
    const pet = createDefaultPet();
    expect(pet.health).toBe(80);
    expect(pet.happiness).toBe(80);
    expect(pet.stage).toBe('egg');
    expect(pet.isDead).toBe(false);
    expect(pet.streak).toBe(0);
    expect(pet.bestStreak).toBe(0);
    expect(typeof pet.bornAt).toBe('number');
    expect(typeof pet.lastUpdated).toBe('number');
  });

  test('each call returns a fresh object', () => {
    const a = createDefaultPet();
    const b = createDefaultPet();
    expect(a).not.toBe(b);
  });
});
