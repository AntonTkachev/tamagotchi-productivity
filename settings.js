const DEFAULT_SETTINGS = {
  productive: [
    'github.com', 'stackoverflow.com', 'notion.so', 'figma.com',
    'docs.google.com', 'linear.app', 'jira.atlassian.com',
    'gitlab.com', 'codepen.io', 'leetcode.com', 'developer.mozilla.org',
  ],
  distracting: [
    'youtube.com', 'twitter.com', 'x.com', 'reddit.com',
    'instagram.com', 'facebook.com', 'tiktok.com', 'netflix.com',
    'twitch.tv',
  ],
};

let settings = { productive: [], distracting: [] };

async function load() {
  const data = await chrome.storage.local.get(['settings', 'pet']);
  settings = data.settings || DEFAULT_SETTINGS;
  render('productive');
  render('distracting');
  renderPetInfo(data.pet);
}

function render(type) {
  const list = document.getElementById(`${type}List`);
  list.innerHTML = '';
  (settings[type] || []).forEach(site => {
    const li = document.createElement('li');
    li.className = 'site-item';
    li.innerHTML = `<span>${site}</span><button data-type="${type}" data-site="${site}">✕</button>`;
    list.appendChild(li);
  });
}

function renderPetInfo(pet) {
  if (!pet) return;
  const born = new Date(pet.bornAt).toLocaleDateString();
  document.getElementById('petInfo').innerHTML =
    `Stage: <strong>${pet.stage || 'egg'}</strong>&emsp;` +
    `Age: <strong>${pet.age || 0} days</strong>&emsp;` +
    `Health: <strong>${Math.round(pet.health || 0)}</strong>&emsp;` +
    `Happiness: <strong>${Math.round(pet.happiness || 0)}</strong><br>` +
    `Born: <strong>${born}</strong>&emsp;` +
    `Focus today: <strong>${Math.round(pet.focusMinutesToday || 0)} min</strong>`;
}

function cleanHostname(raw) {
  return raw.trim().toLowerCase()
    .replace(/^https?:\/\//i, '')
    .replace(/\/.*$/, '');
}

function addSite(type) {
  const input = document.getElementById(`${type}Input`);
  const val = cleanHostname(input.value);
  if (!val || settings[type].includes(val)) { input.value = ''; return; }
  settings[type].push(val);
  save();
  render(type);
  input.value = '';
}

function removeSite(type, site) {
  settings[type] = settings[type].filter(s => s !== site);
  save();
  render(type);
}

async function save() {
  await chrome.storage.local.set({ settings });
}

async function resetPet() {
  if (!confirm('Reset your pet? It will start over as a fresh egg.')) return;
  const newPet = {
    health: 80,
    happiness: 80,
    age: 0,
    stage: 'egg',
    bornAt: Date.now(),
    lastUpdated: Date.now(),
    focusMinutesToday: 0,
    lastFocusDate: new Date().toDateString(),
    isDead: false,
    currentSiteType: 'neutral',
  };
  await chrome.storage.local.set({ pet: newPet });
  renderPetInfo(newPet);
}

// ─── Event wiring ─────────────────────────────────────────────────────────────
document.getElementById('addProductive').addEventListener('click',
  () => addSite('productive'));
document.getElementById('addDistracting').addEventListener('click',
  () => addSite('distracting'));

document.getElementById('productiveInput').addEventListener('keydown',
  e => e.key === 'Enter' && addSite('productive'));
document.getElementById('distractingInput').addEventListener('keydown',
  e => e.key === 'Enter' && addSite('distracting'));

document.addEventListener('click', e => {
  const btn = e.target.closest('button[data-site]');
  if (btn) removeSite(btn.dataset.type, btn.dataset.site);
});

document.getElementById('resetPetBtn').addEventListener('click', resetPet);

load();
