// Tests for background.js Chrome event handler wiring.
// importScripts is mocked so petLogic functions are injected into global scope.

const petLogic = require('../petLogic');

// Make petLogic symbols available globally (simulates importScripts behaviour)
Object.assign(global, petLogic);
global.importScripts = jest.fn();

// Require background after globals are set up
require('../background');

const MIN = 60 * 1000;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInstalledListener() {
  return chrome.runtime.onInstalled.addListener.mock.calls[0][0];
}

function getAlarmListener() {
  return chrome.alarms.onAlarm.addListener.mock.calls[0][0];
}

function getMessageListener() {
  return chrome.runtime.onMessage.addListener.mock.calls[0][0];
}

// ─── onInstalled ──────────────────────────────────────────────────────────────

describe('onInstalled', () => {
  test('creates default pet if none exists', async () => {
    await getInstalledListener()();
    const result = await chrome.storage.local.get(['pet']);
    expect(result.pet).toBeDefined();
    expect(result.pet.stage).toBe('egg');
    expect(result.pet.health).toBe(80);
  });

  test('creates default settings if none exist', async () => {
    await getInstalledListener()();
    const result = await chrome.storage.local.get(['settings']);
    expect(result.settings).toBeDefined();
    expect(result.settings.productive).toContain('github.com');
  });

  test('does not overwrite existing pet', async () => {
    const existingPet = { ...petLogic.createDefaultPet(), health: 42 };
    await chrome.storage.local.set({ pet: existingPet });
    await getInstalledListener()();
    const result = await chrome.storage.local.get(['pet']);
    expect(result.pet.health).toBe(42);
  });

  test('schedules the tick alarm', async () => {
    await getInstalledListener()();
    expect(chrome.alarms.create).toHaveBeenCalledWith('tick', { periodInMinutes: 5 });
  });
});

// ─── tick alarm ───────────────────────────────────────────────────────────────

describe('tick alarm', () => {
  beforeEach(async () => {
    // Set up a clean pet + settings before each tick test
    await getInstalledListener()();
  });

  test('does nothing if no pet in storage', async () => {
    await chrome.storage.local.clear();
    await getAlarmListener()({ name: 'tick' });
    // No error thrown, no pet set
    const result = await chrome.storage.local.get(['pet']);
    expect(result.pet).toBeUndefined();
  });

  test('updates pet and saves to storage', async () => {
    const now = Date.now();
    const pet = { ...petLogic.createDefaultPet(), lastUpdated: now - 5 * MIN };
    await chrome.storage.local.set({ pet, currentSite: 'github.com', siteTimestamp: now - 1 * MIN });

    await getAlarmListener()({ name: 'tick' });

    const result = await chrome.storage.local.get(['pet']);
    expect(result.pet.health).toBe(82); // +2 for productive
    expect(result.pet.currentSiteType).toBe('productive');
  });

  test('ignores non-tick alarms', async () => {
    const before = await chrome.storage.local.get(['pet']);
    await getAlarmListener()({ name: 'other' });
    const after = await chrome.storage.local.get(['pet']);
    expect(after).toEqual(before);
  });
});

// ─── onMessage (SITE_VISIT) ───────────────────────────────────────────────────

describe('onMessage SITE_VISIT', () => {
  test('stores hostname and timestamp', async () => {
    getMessageListener()({ type: 'SITE_VISIT', hostname: 'github.com' });
    const result = await chrome.storage.local.get(['currentSite', 'siteTimestamp']);
    expect(result.currentSite).toBe('github.com');
    expect(typeof result.siteTimestamp).toBe('number');
  });

  test('ignores unknown message types', async () => {
    getMessageListener()({ type: 'UNKNOWN' });
    const result = await chrome.storage.local.get(['currentSite']);
    expect(result.currentSite).toBeUndefined();
  });
});
