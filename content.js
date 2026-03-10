try {
  chrome.runtime.sendMessage({
    type: 'SITE_VISIT',
    hostname: window.location.hostname,
  });
} catch (e) {
  // Extension context may be invalid on some pages
}
