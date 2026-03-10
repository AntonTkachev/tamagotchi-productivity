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
  const data = await chrome.storage.local.get(['settings', 'pet', 'devMode']);
  settings = data.settings || DEFAULT_SETTINGS;
  render('productive');
  render('distracting');
  renderPetInfo(data.pet);
  if (typeof DEV_MODE !== 'undefined' && DEV_MODE) initDevPanel(data.pet);
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
    `Focus today: <strong>${Math.round(pet.focusMinutesToday || 0)} min</strong><br>` +
    `Streak: <strong>${pet.streak || 0} days</strong>&emsp;` +
    `Best: <strong>${pet.bestStreak || 0} days</strong>`;
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
  if (!confirm(chrome.i18n.getMessage('confirm_reset_msg') || 'Reset your pet? It will start over as a fresh egg.')) return;
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

// ─── Dev panel ────────────────────────────────────────────────────────────────

function initDevPanel(pet) {
  const panel = document.getElementById('devPanel');
  panel.classList.add('visible');
  if (!pet) return;

  // Sync sliders to current pet state
  const healthSlider    = document.getElementById('devHealth');
  const happinessSlider = document.getElementById('devHappiness');
  const ageInput        = document.getElementById('devAge');

  healthSlider.value    = Math.round(pet.health    || 0);
  happinessSlider.value = Math.round(pet.happiness || 0);
  ageInput.value        = pet.age || 0;

  document.getElementById('devHealthVal').textContent    = healthSlider.value;
  document.getElementById('devHappinessVal').textContent = happinessSlider.value;

  // Highlight active stage / site buttons
  document.querySelectorAll('[data-stage]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.stage === pet.stage);
  });
  document.querySelectorAll('[data-site]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.site === pet.currentSiteType);
  });

  // Sliders
  healthSlider.addEventListener('input', async () => {
    document.getElementById('devHealthVal').textContent = healthSlider.value;
    await patchPet({ health: Number(healthSlider.value) });
  });
  happinessSlider.addEventListener('input', async () => {
    document.getElementById('devHappinessVal').textContent = happinessSlider.value;
    await patchPet({ happiness: Number(happinessSlider.value) });
  });

  // Age
  ageInput.addEventListener('change', async () => {
    await patchPet({ age: Number(ageInput.value) });
  });

  // Stage buttons
  document.querySelectorAll('[data-stage]').forEach(btn => {
    btn.addEventListener('click', async () => {
      document.querySelectorAll('[data-stage]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const isDead = btn.dataset.stage === 'dead';
      await patchPet({ stage: btn.dataset.stage, isDead });
    });
  });

  // Site type buttons
  document.querySelectorAll('[data-site]').forEach(btn => {
    btn.addEventListener('click', async () => {
      document.querySelectorAll('[data-site]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      await patchPet({ currentSiteType: btn.dataset.site });
    });
  });
}

async function patchPet(patch) {
  const data = await chrome.storage.local.get('pet');
  if (!data.pet) return;
  const updated = { ...data.pet, ...patch };
  await chrome.storage.local.set({ pet: updated });
  renderPetInfo(updated);
}

load();
