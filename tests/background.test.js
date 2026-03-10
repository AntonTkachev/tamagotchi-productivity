// Tests for background.js Chrome event handler wiring.
// importScripts is mocked so petLogic functions are injected into global scope.

const petLogic = require('../petLogic');

// Make petLogic symbols available globally (simulates importScripts behaviour)
Object.assign(global, petLogic);
global.importScripts = jest.fn();

// Require background after globals are set up
require('../background');

// Capture listener references BEFORE beforeEach clears mock.calls
const installedListener = chrome.runtime.onInstalled.addListener.mock.calls[0][0];
const alarmListener     = chrome.alarms.onAlarm.addListener.mock.calls[0][0];
const messageListener   = chrome.runtime.onMessage.addListener.mock.calls[0][0];

const MIN = 60 * 1000;

// ─── onInstalled ──────────────────────────────────────────────────────────────

describe('onInstalled', () => {
  test('opens onboarding tab when no pet exists', async () => {
    await installedListener();
    expect(chrome.tabs.create).toHaveBeenCalledWith({
      url: 'chrome-extension://test-id/onboarding.html',
    });
  });

  test('does NOT create a pet on install (onboarding does that)', async () => {
    await installedListener();
    const result = await chrome.storage.local.get(['pet']);
    expect(result.pet).toBeUndefined();
  });

  test('creates default settings if none exist', async () => {
    await installedListener();
    const result = await chrome.storage.local.get(['settings']);
    expect(result.settings).toBeDefined();
    expect(result.settings.productive).toContain('github.com');
    expect(result.settings.distracting).toContain('youtube.com');
  });

  test('does not overwrite existing settings', async () => {
    const custom = { productive: ['custom.com'], distracting: [] };
    await chrome.storage.local.set({ settings: custom });
    await installedListener();
    const result = await chrome.storage.local.get(['settings']);
    expect(result.settings.productive).toEqual(['custom.com']);
  });

  test('does not open onboarding tab when pet already exists', async () => {
    const existingPet = { ...petLogic.createDefaultPet(), petType: 'cat' };
    await chrome.storage.local.set({ pet: existingPet });
    await installedListener();
    expect(chrome.tabs.create).not.toHaveBeenCalled();
  });

  test('schedules the tick alarm', async () => {
    await installedListener();
    expect(chrome.alarms.create).toHaveBeenCalledWith('tick', { periodInMinutes: 5 });
  });
});

// ─── tick alarm ───────────────────────────────────────────────────────────────

describe('tick alarm', () => {
  test('does nothing if no pet in storage', async () => {
    await alarmListener({ name: 'tick' });
    const result = await chrome.storage.local.get(['pet']);
    expect(result.pet).toBeUndefined();
  });

  test('updates pet stats and saves to storage', async () => {
    const now = Date.now();
    const pet = { ...petLogic.createDefaultPet(), petType: 'rabbit', lastUpdated: now - 5 * MIN };
    await chrome.storage.local.set({
      pet,
      currentSite:   'github.com',
      siteTimestamp: now - 1 * MIN,
    });

    await alarmListener({ name: 'tick' });

    const result = await chrome.storage.local.get(['pet']);
    expect(result.pet.health).toBe(82); // +2 for productive
    expect(result.pet.currentSiteType).toBe('productive');
  });

  test('drains stats on distracting site', async () => {
    const now = Date.now();
    const pet = { ...petLogic.createDefaultPet(), petType: 'rabbit', lastUpdated: now - 5 * MIN };
    await chrome.storage.local.set({
      pet,
      currentSite:   'youtube.com',
      siteTimestamp: now - 1 * MIN,
    });

    await alarmListener({ name: 'tick' });

    const result = await chrome.storage.local.get(['pet']);
    expect(result.pet.health).toBe(77);    // -3 for distracting
    expect(result.pet.happiness).toBe(78); // -2 for distracting
    expect(result.pet.currentSiteType).toBe('distracting');
  });

  test('falls back to DEFAULT_SETTINGS when no settings stored', async () => {
    const now = Date.now();
    const pet = { ...petLogic.createDefaultPet(), petType: 'rabbit', lastUpdated: now - 5 * MIN };
    // Only pet in storage, no settings
    await chrome.storage.local.set({ pet, currentSite: 'github.com', siteTimestamp: now - MIN });

    await alarmListener({ name: 'tick' });

    const result = await chrome.storage.local.get(['pet']);
    expect(result.pet.health).toBe(82); // github.com is in DEFAULT_SETTINGS.productive
  });

  test('ignores non-tick alarms', async () => {
    const pet = petLogic.createDefaultPet();
    await chrome.storage.local.set({ pet });
    const before = await chrome.storage.local.get(['pet']);
    await alarmListener({ name: 'other' });
    const after = await chrome.storage.local.get(['pet']);
    expect(after.pet).toEqual(before.pet);
  });
});

// ─── onMessage (SITE_VISIT) ───────────────────────────────────────────────────

describe('onMessage SITE_VISIT', () => {
  test('stores hostname and timestamp', async () => {
    messageListener({ type: 'SITE_VISIT', hostname: 'github.com' });
    const result = await chrome.storage.local.get(['currentSite', 'siteTimestamp']);
    expect(result.currentSite).toBe('github.com');
    expect(typeof result.siteTimestamp).toBe('number');
  });

  test('overwrites previous site on new visit', async () => {
    messageListener({ type: 'SITE_VISIT', hostname: 'reddit.com' });
    messageListener({ type: 'SITE_VISIT', hostname: 'github.com' });
    const result = await chrome.storage.local.get(['currentSite']);
    expect(result.currentSite).toBe('github.com');
  });

  test('ignores unknown message types', async () => {
    messageListener({ type: 'UNKNOWN' });
    const result = await chrome.storage.local.get(['currentSite']);
    expect(result.currentSite).toBeUndefined();
  });
});
