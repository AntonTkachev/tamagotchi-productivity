// Pure business logic — no Chrome API dependencies.
// Used by background.js (via importScripts) and by tests (via require).

// ─── Defaults ─────────────────────────────────────────────────────────────────

function createDefaultPet() {
  const now = Date.now();
  return {
    health: 80,
    happiness: 80,
    age: 0,
    stage: 'egg',
    bornAt: now,
    lastUpdated: now,
    focusMinutesToday: 0,
    lastFocusDate: new Date(now).toDateString(),
    streak: 0,
    bestStreak: 0,
    isDead: false,
    currentSiteType: 'neutral',
  };
}

const DEFAULT_SETTINGS = {
  productive: [
    'github.com', 'stackoverflow.com', 'notion.so', 'figma.com',
    'docs.google.com', 'linear.app', 'jira.atlassian.com',
    'gitlab.com', 'codepen.io', 'leetcode.com', 'developer.mozilla.org',
    'npmjs.com', 'replit.com',
  ],
  distracting: [
    'youtube.com', 'twitter.com', 'x.com', 'reddit.com',
    'instagram.com', 'facebook.com', 'tiktok.com', 'netflix.com',
    'twitch.tv', '9gag.com',
  ],
};

// ─── Pure functions ────────────────────────────────────────────────────────────

/**
 * Returns the stage name based on age, health, and death state.
 */
function getStage(ageDays, health, isDead) {
  if (isDead) return 'dead';
  if (ageDays < 3) return 'egg';
  if (ageDays < 8)  return health > 20 ? 'baby'  : 'egg';
  if (ageDays < 21) return health > 30 ? 'teen'  : 'baby';
  if (ageDays < 60) return health > 40 ? 'adult' : 'teen';
  return health > 60 ? 'legend' : 'adult';
}

/**
 * Categorizes a hostname as 'productive', 'distracting', or 'neutral'.
 * Returns 'neutral' if the site visit timestamp is stale (> 10 min ago).
 */
function categorizeSite(hostname, settings, siteTimestamp, now) {
  if (!hostname) return 'neutral';

  const siteIsRecent = (now - (siteTimestamp || 0)) < 10 * 60 * 1000;
  if (!siteIsRecent) return 'neutral';

  const productive  = (settings && settings.productive)  || [];
  const distracting = (settings && settings.distracting) || [];

  if (productive.some(s  => hostname.includes(s))) return 'productive';
  if (distracting.some(s => hostname.includes(s))) return 'distracting';
  return 'neutral';
}

/**
 * Computes the next pet state given current context.
 * Returns { pet, skipped } — skipped = true when absence was treated as sleep.
 */
function computeStatUpdate(pet, settings, currentSite, siteTimestamp, now) {
  const timeSinceUpdate = now - pet.lastUpdated;

  // Long absence (> 8 h) → treat as sleep, skip penalty
  if (timeSinceUpdate > 8 * 60 * 60 * 1000) {
    return {
      pet: { ...pet, lastUpdated: now, currentSiteType: 'sleeping' },
      skipped: true,
    };
  }

  const result = { ...pet };

  // New day: update streak, reset daily focus counter
  const today = new Date(now).toDateString();
  if (result.lastFocusDate !== today) {
    if (result.focusMinutesToday > 0) {
      result.streak = (result.streak || 0) + 1;
    } else {
      result.streak = 0;
    }
    result.bestStreak = Math.max(result.bestStreak || 0, result.streak);
    result.focusMinutesToday = 0;
    result.lastFocusDate = today;
  }

  const siteType = categorizeSite(currentSite, settings, siteTimestamp, now);
  const ageDays  = (now - result.bornAt) / (1000 * 60 * 60 * 24);
  result.age     = Math.floor(ageDays);

  // Dead pets can only be revived by visiting a productive site
  if (pet.isDead) {
    if (siteType === 'productive') {
      result.isDead    = false;
      result.health    = 10;
      result.happiness = 20;
    } else {
      result.isDead = true;
    }
    result.stage           = getStage(ageDays, result.health, result.isDead);
    result.currentSiteType = siteType;
    result.lastUpdated     = now;
    return { pet: result, skipped: false };
  }

  if (siteType === 'productive') {
    result.health          = Math.min(100, result.health + 2);
    result.happiness       = Math.min(100, result.happiness + 1);
    result.focusMinutesToday = (result.focusMinutesToday || 0) + 5;
  } else if (siteType === 'distracting') {
    result.health    = Math.max(0, result.health    - 3);
    result.happiness = Math.max(0, result.happiness - 2);
  } else {
    // No bad sites open = small positive reward
    result.health    = Math.min(100, result.health    + 0.5);
    result.happiness = Math.min(100, result.happiness + 0.3);
  }

  result.isDead = result.health <= 0;
  if (result.isDead) result.health = 0;

  result.stage           = getStage(ageDays, result.health, result.isDead);
  result.currentSiteType = siteType;
  result.lastUpdated     = now;

  return { pet: result, skipped: false };
}

/**
 * Strips protocol and path from a URL string, returns bare hostname.
 * e.g. "https://github.com/user/repo" → "github.com"
 */
function cleanHostname(raw) {
  return (raw || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//i, '')
    .replace(/\/.*$/, '');
}

// ─── CommonJS export (tests / Node) ───────────────────────────────────────────
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    createDefaultPet,
    DEFAULT_SETTINGS,
    getStage,
    categorizeSite,
    computeStatUpdate,
    cleanHostname,
  };
}
