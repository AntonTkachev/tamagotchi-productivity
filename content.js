function sendVisit() {
  try {
    chrome.runtime.sendMessage({
      type: 'SITE_VISIT',
      hostname: window.location.hostname,
    });
  } catch (e) {
    // Extension context may be invalid on some pages
  }
}

sendVisit();
// Refresh timestamp every 4 min so siteTimestamp never goes stale
// while the tab is still open (closes the 10-min staleness loophole)
setInterval(sendVisit, 4 * 60 * 1000);
