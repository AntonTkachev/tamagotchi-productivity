/**
 * Lightweight i18n helper for the extension's HTML pages.
 * - Replaces [data-i18n] element text content
 * - Replaces [data-i18n-placeholder] input placeholders
 * - Sets dir="rtl" automatically for Arabic
 */
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

// Shorthand used in JS files
function t(key) {
  return chrome.i18n.getMessage(key) || key;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initI18n);
} else {
  initI18n();
}
