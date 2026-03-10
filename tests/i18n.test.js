// Tests for i18n helper functions.
// i18n.js relies on chrome.i18n and DOM APIs. We test:
//   - t()        — pure wrapper, easy to test
//   - initI18n() — DOM interaction via manual mocks

// ─── t() helper ───────────────────────────────────────────────────────────────

// Load the t() and initI18n() functions without triggering the DOMContentLoaded
// auto-init. We mock document.readyState = 'loading' so the event listener is
// registered but never fires during tests.

// Minimal DOM mock (node environment has no real DOM)
global.document = {
  documentElement: { setAttribute: jest.fn() },
  readyState:      'loading',
  addEventListener: jest.fn(),
  querySelectorAll: jest.fn(() => []),
};

// Load module after DOM mock is in place
require('../i18n');

describe('t() — translation shorthand', () => {
  test('returns translated string when getMessage provides one', () => {
    chrome.i18n.getMessage.mockReturnValue('Здоровье');
    expect(t('stat_health')).toBe('Здоровье');
  });

  test('falls back to key when getMessage returns empty string', () => {
    chrome.i18n.getMessage.mockReturnValue('');
    expect(t('missing_key')).toBe('missing_key');
  });

  test('falls back to key when getMessage returns falsy', () => {
    chrome.i18n.getMessage.mockReturnValue(null);
    expect(t('another_key')).toBe('another_key');
  });

  test('calls getMessage with the exact key', () => {
    chrome.i18n.getMessage.mockReturnValue('Egg');
    t('stage_egg');
    expect(chrome.i18n.getMessage).toHaveBeenCalledWith('stage_egg');
  });
});

// ─── initI18n() — RTL detection ───────────────────────────────────────────────

describe('initI18n() — RTL detection', () => {
  beforeEach(() => {
    // Reset setAttribute call history between tests
    document.documentElement.setAttribute.mockClear();
  });

  test('sets dir=rtl for Arabic locale', () => {
    chrome.i18n.getUILanguage.mockReturnValue('ar');
    initI18n();
    expect(document.documentElement.setAttribute).toHaveBeenCalledWith('dir', 'rtl');
  });

  test('sets dir=rtl for regional Arabic variants (ar-SA)', () => {
    chrome.i18n.getUILanguage.mockReturnValue('ar-SA');
    initI18n();
    expect(document.documentElement.setAttribute).toHaveBeenCalledWith('dir', 'rtl');
  });

  test('does NOT set dir=rtl for English', () => {
    chrome.i18n.getUILanguage.mockReturnValue('en');
    initI18n();
    expect(document.documentElement.setAttribute).not.toHaveBeenCalledWith('dir', 'rtl');
  });

  test('does NOT set dir=rtl for Russian', () => {
    chrome.i18n.getUILanguage.mockReturnValue('ru');
    initI18n();
    expect(document.documentElement.setAttribute).not.toHaveBeenCalledWith('dir', 'rtl');
  });

  test('does NOT set dir=rtl for Spanish', () => {
    chrome.i18n.getUILanguage.mockReturnValue('es');
    initI18n();
    expect(document.documentElement.setAttribute).not.toHaveBeenCalledWith('dir', 'rtl');
  });
});
