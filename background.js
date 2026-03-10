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
  chrome.alarms.create('tick', { periodInMinutes: 5 });
});

// ─── Tick ─────────────────────────────────────────────────────────────────────

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'tick') await tick();
});

async function tick() {
  const data = await chrome.storage.local.get(
    ['pet', 'settings', 'currentSite', 'siteTimestamp']
  );
  if (!data.pet) return;

  const { pet } = computeStatUpdate(
    data.pet,
    data.settings || DEFAULT_SETTINGS,
    data.currentSite,
    data.siteTimestamp,
    Date.now()
  );

  await chrome.storage.local.set({ pet });
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
