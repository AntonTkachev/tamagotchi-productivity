importScripts('petLogic.js');

// ─── Install / startup ────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(async () => {
  const existing = await chrome.storage.local.get(['pet', 'settings']);
  if (!existing.settings) {
    await chrome.storage.local.set({ settings: DEFAULT_SETTINGS });
  }
  if (!existing.pet) {
    // First launch — open pet selection screen
    chrome.tabs.create({ url: chrome.runtime.getURL('onboarding.html') });
  }
  chrome.alarms.create('tick', { periodInMinutes: 5 });
});

chrome.runtime.onStartup.addListener(() => {
  chrome.alarms.get('tick', alarm => {
    if (!alarm) chrome.alarms.create('tick', { periodInMinutes: 5 });
  });
});

// ─── Tick ─────────────────────────────────────────────────────────────────────

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'tick') await tick();
});

async function tick() {
  const now  = Date.now();
  const data = await chrome.storage.local.get(
    ['pet', 'settings', 'currentSite', 'siteTimestamp', 'siteTimeToday', 'siteTimeDate']
  );
  if (!data.pet) return;

  const { pet } = computeStatUpdate(
    data.pet,
    data.settings || DEFAULT_SETTINGS,
    data.currentSite,
    data.siteTimestamp,
    now
  );

  // ── Track time per site ──────────────────────────────────────────────────
  const today        = new Date(now).toDateString();
  const siteTimeDate = data.siteTimeDate || today;
  const siteTimeToday = siteTimeDate === today ? (data.siteTimeToday || {}) : {};

  const siteIsRecent = data.currentSite &&
    (now - (data.siteTimestamp || 0)) < 10 * 60 * 1000;

  if (siteIsRecent) {
    siteTimeToday[data.currentSite] = (siteTimeToday[data.currentSite] || 0) + 5;
  }

  await chrome.storage.local.set({ pet, siteTimeToday, siteTimeDate: today });
}

// ─── Site tracking ────────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'SITE_VISIT') {
    chrome.storage.local.set({
      currentSite:   message.hostname,
      siteTimestamp: Date.now(),
    });
  }
  return false;
});
