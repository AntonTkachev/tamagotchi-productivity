// Tests for i18n helper logic.
// i18n.js defines functions as globals (not exports) for browser use.
// We inline the logic here to keep the test environment clean.

// ─── Inlined from i18n.js ─────────────────────────────────────────────────────

function t(key) {
  return chrome.i18n.getMessage(key) || key;
}

function initI18n() {
  const locale = chrome.i18n.getUILanguage();
  if (locale.startsWith('ar')) {
    document.documentElement.setAttribute('dir', 'rtl');
  }
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const msg = chrome.i18n.getMessage(el.dataset.i18n);
    if (msg) el.textContent = msg;
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const msg = chrome.i18n.getMessage(el.dataset.i18nPlaceholder);
    if (msg) el.placeholder = msg;
  });
}

// Minimal DOM mock (node environment has no real DOM)
global.document = {
  documentElement: { setAttribute: jest.fn() },
  querySelectorAll: jest.fn(() => []),
};

// ─── t() helper ───────────────────────────────────────────────────────────────

describe('t() — translation shorthand', () => {
  test('returns translated string when getMessage provides one', () => {
    chrome.i18n.getMessage.mockReturnValue('Здоровье');
    expect(t('stat_health')).toBe('Здоровье');
  });

  test('falls back to key when getMessage returns empty string', () => {
    chrome.i18n.getMessage.mockReturnValue('');
    expect(t('missing_key')).toBe('missing_key');
  });

  test('falls back to key when getMessage returns null', () => {
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
    document.documentElement.setAttribute.mockClear();
  });

  test('sets dir=rtl for Arabic locale', () => {
    chrome.i18n.getUILanguage.mockReturnValue('ar');
    initI18n();
    expect(document.documentElement.setAttribute).toHaveBeenCalledWith('dir', 'rtl');
  });

  test('sets dir=rtl for regional Arabic variant ar-SA', () => {
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
