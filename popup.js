const PIXEL = 14; // 10×10 sprite → 140×140px on 160×160 canvas

// ─── Shared palettes ──────────────────────────────────────────────────────────

const BASE_PALETTE = {
  '.': null,
  's': '#DFE6E9', // egg shell
  'S': '#B2BEC3', // egg shell dark
  'e': '#2D3436', // generic eye dark
  'x': '#1A1A2E', // dead X-eye
  'y': '#FDCB6E', // sparkle gold
};

const ANIMAL_PALETTES = {
  rabbit: { b:'#F5F5F5', d:'#DCDCDC', p:'#FFB3C6', n:'#FD79A8', e:'#2D3436', w:'#FFFFFF' },
  cat:    { b:'#FDCB6E', d:'#E17055', G:'#00CEC9', p:'#FD79A8', e:'#2D3436', w:'#FFFFFF' },
  dog:    { b:'#C8956C', d:'#8B5E3C', e:'#2D3436', p:'#FD79A8', r:'#FF7675', w:'#FFFFFF' },
  parrot: { b:'#00B894', d:'#00836B', y:'#FDCB6E', r:'#FF6B6B', e:'#2D3436', k:'#E17055', w:'#FFFFFF' },
};

// Glow colours per site type (applied as box-shadow on canvas container)
const GLOW = {
  productive:  '0 0 24px rgba(0, 184, 148, 0.7)',
  distracting: '0 0 24px rgba(255, 118, 117, 0.7)',
  sleeping:    '0 0 16px rgba(162, 155, 254, 0.4)',
  neutral:     'none',
  dead:        '0 0 24px rgba(99, 110, 114, 0.5)',
};

// ─── Sprites ──────────────────────────────────────────────────────────────────

// Shared: egg and dead (same for all pet types)
const SHARED_SPRITES = {
  egg: [
    [ // frame 0 – eyes open
      '..ssssss..',
      '.ssssssss.',
      'ssssssssss',
      'ssseSsesss',
      'ssssssssss',
      'ssPssssPss',
      'ssssssssss',
      '.ssssssss.',
      '..ssssss..',
      '..........',
    ],
    [ // frame 1 – blink
      '..ssssss..',
      '.ssssssss.',
      'ssssssssss',
      'ssssssssss',
      'ssssssssss',
      'ssPssssPss',
      'ssssssssss',
      '.ssssssss.',
      '..ssssss..',
      '..........',
    ],
  ],
  dead: [
    [
      '..........',
      '..bbbbbb..',
      '.bbbbbbbb.',
      'bbbbbbbbbb',
      'bbbxbbxbbb',
      'bbbbbbbbbb',
      '.bbbbbbbb.',
      '..bbbbbb..',
      '.b......b.',
      '..........',
    ],
    [
      '..........',
      '..bbbbbb..',
      '.bbbbbbbb.',
      'bbbbbbbbbb',
      'bbbxbbxbbb',
      'bbbbbbbbbb',
      '.bbbbbbbb.',
      '..bbbbbb..',
      '.b......b.',
      '..........',
    ],
  ],
};

// Per-animal sprites for baby / teen / adult / legend
const ANIMAL_SPRITES = {

  rabbit: {
    baby: [
      [ '..bb..bb..', '.bbbbbbbb.', 'bbbbbbbbbb', 'bbebbbbebb',
        'bbbbbbbbbb', 'bbbbnnbbbb', '.bbbbbbbb.', '..bbbbbb..', '.b......b.', '..........' ],
      [ '..bb..bb..', '.bbbbbbbb.', 'bbbbbbbbbb', 'bbbbbbbbbb',
        'bbbbbbbbbb', 'bbbbnnbbbb', '.bbbbbbbb.', '..bbbbbb..', '.b......b.', '..........' ],
    ],
    teen: [
      [ '.bb....bb.', '.bpb..bpb.', 'bbbbbbbbbb', 'bbbbbbbbbb',
        'bbebbbbebb', 'bbbbbbbbbb', 'bbbbnnbbbb', '.bbbbbbbb.', '.b......b.', '..........' ],
      [ '.bb....bb.', '.bpb..bpb.', 'bbbbbbbbbb', 'bbbbbbbbbb',
        'bbbbbbbbbb', 'bbbbbbbbbb', 'bbbbnnbbbb', '.bbbbbbbb.', '.b......b.', '..........' ],
    ],
    adult: [
      [ '.bb....bb.', '.bpb..bpb.', '.bpb..bpb.', 'bbbbbbbbbb',
        'bbebbbbebb', 'bbbbbbbbbb', 'bbbbnnbbbb', 'bbbbbbbbbb', '.bbbbbbbb.', '..bb..bb..' ],
      [ '.bb....bb.', '.bpb..bpb.', '.bpb..bpb.', 'bbbbbbbbbb',
        'bbbbbbbbbb', 'bbbbbbbbbb', 'bbbbnnbbbb', 'bbbbbbbbbb', '.bbbbbbbb.', '..bb..bb..' ],
    ],
    legend: [
      [ 'y.bb..bb.y', '.bpb..bpb.', '.bpb..bpb.', 'bbbbbbbbbb',
        'bbebbbbebb', 'bbbbbbbbbb', 'bbbbnnbbbb', 'bbbbbbbbbb', '.bbbbbbbb.', '..bb..bb..' ],
      [ '.y.bb.bb.y', '.bpb..bpb.', '.bpb..bpb.', 'bbbbbbbbbb',
        'bbbbbbbbbb', 'bbbbbbbbbb', 'bbbbnnbbbb', 'bbbbbbbbbb', '.bbbbbbbb.', '..bb..bb..' ],
    ],
  },

  cat: {
    baby: [
      [ '..b....b..', '.bb....bb.', '.bbbbbbbb.', 'bbbbbbbbbb',
        'bbGbbbbGbb', 'bbbbbbbbbb', 'bbbbpbbbbb', '.bbbbbbbb.', '..bbbbbb..', '.b......b.' ],
      [ '..b....b..', '.bb....bb.', '.bbbbbbbb.', 'bbbbbbbbbb',
        'bbbbbbbbbb', 'bbbbbbbbbb', 'bbbbpbbbbb', '.bbbbbbbb.', '..bbbbbb..', '.b......b.' ],
    ],
    teen: [
      [ '.b......b.', '.bb....bb.', 'bbbbbbbbbb', 'bbbbbbbbbb',
        'bbGbbbbGbb', 'bbbbbbbbbb', 'bbbbpbbbbb', '.bbbbbbbb.', '..bbbbbb..', '.b......b.' ],
      [ '.b......b.', '.bb....bb.', 'bbbbbbbbbb', 'bbbbbbbbbb',
        'bbbbbbbbbb', 'bbbbbbbbbb', 'bbbbpbbbbb', '.bbbbbbbb.', '..bbbbbb..', '.b......b.' ],
    ],
    adult: [
      [ 'b........b', '.bb....bb.', '.bbbbbbbb.', 'bbbbbbbbbb',
        'bbGbbbbGbb', 'bbbbbbbbbb', 'bbbbpbbbbb', 'bbbbbbbbbb', '.bbbbbbbb.', '..bb..bb..' ],
      [ 'b........b', '.bb....bb.', '.bbbbbbbb.', 'bbbbbbbbbb',
        'bbbbbbbbbb', 'bbbbbbbbbb', 'bbbbpbbbbb', 'bbbbbbbbbb', '.bbbbbbbb.', '..bb..bb..' ],
    ],
    legend: [
      [ 'yb......by', '.bb....bb.', '.bbbbbbbb.', 'bbbbbbbbbb',
        'bbGbbbbGbb', 'bbbbbbbbbb', 'bbbbpbbbbb', 'bbbbbbbbbb', '.bbbbbbbb.', '..bb..bb..' ],
      [ '.yb....by.', '.bb....bb.', '.bbbbbbbb.', 'bbbbbbbbbb',
        'bbbbbbbbbb', 'bbbbbbbbbb', 'bbbbpbbbbb', 'bbbbbbbbbb', '.bbbbbbbb.', '..bb..bb..' ],
    ],
  },

  dog: {
    baby: [
      [ '..bbbbbb..', 'ddbbbbbbdd', 'ddbebbebdd', 'ddbbbbbbdd',
        'ddbbpbbbdd', 'ddbbbbbbdd', '..bbbbbb..', '.bb....bb.', '.b......b.', '..........' ],
      [ '..bbbbbb..', 'ddbbbbbbdd', 'ddbbbbbbdd', 'ddbbbbbbdd',
        'ddbbpbbbdd', 'ddbbbbbbdd', '..bbbbbb..', '.bb....bb.', '.b......b.', '..........' ],
    ],
    teen: [
      [ '..bbbbbb..', 'ddbbbbbbdd', 'ddbbbbbbdd', 'ddbebbebdd',
        'ddbbbbbbdd', 'ddbbpbbbdd', 'ddbbrrbbdd', 'ddbbbbbbdd', '..bbbbbb..', '.b......b.' ],
      [ '..bbbbbb..', 'ddbbbbbbdd', 'ddbbbbbbdd', 'ddbbbbbbdd',
        'ddbbbbbbdd', 'ddbbpbbbdd', 'ddbbbbbbdd', 'ddbbbbbbdd', '..bbbbbb..', '.b......b.' ],
    ],
    adult: [
      [ '..bbbbbb..', 'ddbbbbbbdd', 'ddbbbbbbdd', 'ddbebbebdd',
        'ddbbbbbbdd', 'ddbbpbbbdd', 'ddbbrrbbdd', 'ddbbbbbbdd', '..bbbbbb..', '.bb....bb.' ],
      [ '..bbbbbb..', 'ddbbbbbbdd', 'ddbbbbbbdd', 'ddbbbbbbdd',
        'ddbbbbbbdd', 'ddbbpbbbdd', 'ddbbbbbbdd', 'ddbbbbbbdd', '..bbbbbb..', '.bb....bb.' ],
    ],
    legend: [
      [ 'y.bbbbbb.y', 'ddbbbbbbdd', 'ddbbbbbbdd', 'ddbebbebdd',
        'ddbbbbbbdd', 'ddbbpbbbdd', 'ddbbrrbbdd', 'ddbbbbbbdd', '..bbbbbb..', '.bb....bb.' ],
      [ '.y.bbbb.y.', 'ddbbbbbbdd', 'ddbbbbbbdd', 'ddbbbbbbdd',
        'ddbbbbbbdd', 'ddbbpbbbdd', 'ddbbbbbbdd', 'ddbbbbbbdd', '..bbbbbb..', '.bb....bb.' ],
    ],
  },

  parrot: {
    baby: [
      [ '...rrrr...', '..bbbbbb..', '.bbbbbbbb.', '.bbebbebb.',
        '..bbkkbb..', '.bbbbbbbb.', '..bbbbbb..', '.b......b.', '..........', '..........' ],
      [ '...rrrr...', '..bbbbbb..', '.bbbbbbbb.', '.bbbbbbbb.',
        '..bbkkbb..', '.bbbbbbbb.', '..bbbbbb..', '.b......b.', '..........', '..........' ],
    ],
    teen: [
      [ '..yrrrry..', '..bbbbbb..', '.bbbbbbbb.', '.bbebbebb.',
        '..bbkkbb..', '.bbbbbbbb.', '.bybbbbyb.', '..bbbbbb..', '.b......b.', '..........' ],
      [ '..yrrrry..', '..bbbbbb..', '.bbbbbbbb.', '.bbbbbbbb.',
        '..bbkkbb..', '.bbbbbbbb.', '.bybbbbyb.', '..bbbbbb..', '.b......b.', '..........' ],
    ],
    adult: [
      [ '..yrrrry..', '..bbbbbb..', '.bbbbbbbb.', '.bbebbebb.',
        '..bbkkbb..', '.bbbbbbbb.', '.bybbbbyb.', '.bbbbbbbb.', '.bb....bb.', '.b......b.' ],
      [ '..yrrrry..', '..bbbbbb..', '.bbbbbbbb.', '.bbbbbbbb.',
        '..bbkkbb..', '.bbbbbbbb.', '.bybbbbyb.', '.bbbbbbbb.', '.bb....bb.', '.b......b.' ],
    ],
    legend: [
      [ 'y.yrrrry.y', '..bbbbbb..', '.bbbbbbbb.', '.bbebbebb.',
        '..bbkkbb..', '.bbbbbbbb.', '.bybbbbyb.', '.bbbbbbbb.', '.bb....bb.', '.b......b.' ],
      [ '.y.rrrr.y.', '..bbbbbb..', '.bbbbbbbb.', '.bbbbbbbb.',
        '..bbkkbb..', '.bbbbbbbb.', '.bybbbbyb.', '.bbbbbbbb.', '.bb....bb.', '.b......b.' ],
    ],
  },
};

// ─── Drawing helpers ──────────────────────────────────────────────────────────

function getSprites(stage, petType) {
  if (stage === 'egg' || stage === 'dead') return SHARED_SPRITES[stage];
  const animal = ANIMAL_SPRITES[petType];
  if (!animal) return SHARED_SPRITES.egg;
  return animal[stage] || animal.adult;
}

function buildPalette(stage, petType) {
  const animal = ANIMAL_PALETTES[petType] || ANIMAL_PALETTES.rabbit;
  const base   = { ...BASE_PALETTE, ...animal };

  if (stage === 'dead') {
    return { ...base, b: '#636E72', d: '#2D3436' };
  }
  return base;
}

const canvas    = document.getElementById('petCanvas');
const ctx       = canvas.getContext('2d');
const container = document.querySelector('.canvas-container');

function drawSprite(rows, palette) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const offsetX = Math.floor((canvas.width  - rows[0].length * PIXEL) / 2);
  const offsetY = Math.floor((canvas.height - rows.length    * PIXEL) / 2);
  for (let r = 0; r < rows.length; r++) {
    for (let c = 0; c < rows[r].length; c++) {
      const color = palette[rows[r][c]];
      if (color) {
        ctx.fillStyle = color;
        ctx.fillRect(offsetX + c * PIXEL, offsetY + r * PIXEL, PIXEL, PIXEL);
      }
    }
  }
}

// ─── State ────────────────────────────────────────────────────────────────────

let pet   = null;
let frame = 0;

function tick() {
  if (!pet) return;
  const stage    = pet.stage   || 'egg';
  const petType  = pet.petType || 'rabbit';
  const sprites  = getSprites(stage, petType);
  drawSprite(sprites[frame % sprites.length], buildPalette(stage, petType));
  frame = (frame + 1) % sprites.length;
}

// ─── UI update ────────────────────────────────────────────────────────────────

const PET_NAMES = { rabbit:'BUNNY', cat:'KITTY', dog:'BUDDY', parrot:'POLY' };

const STAGE_LABELS = {
  egg:    '● EGG ●',
  baby:   '● BABY ●',
  teen:   '● TEEN ●',
  adult:  '● ADULT ●',
  legend: '✦ LEGEND ✦',
  dead:   '✝ DEPARTED ✝',
};

const MOOD_LABELS = {
  productive:  '🎉 thriving!',
  distracting: '😰 distracted...',
  neutral:     '😊 chilling',
  sleeping:    '💤 sleeping',
  dead:        '💀 rip',
};

function updateUI(data) {
  if (!data) return;
  pet = data;

  document.getElementById('petName').textContent =
    PET_NAMES[pet.petType] || 'PIXEL';

  document.getElementById('stageBadge').textContent =
    STAGE_LABELS[pet.stage] || STAGE_LABELS.egg;

  document.getElementById('deadOverlay').classList.toggle('visible', !!pet.isDead);

  document.getElementById('mood').textContent =
    MOOD_LABELS[pet.currentSiteType] || MOOD_LABELS.neutral;

  container.style.boxShadow = GLOW[pet.isDead ? 'dead' : (pet.currentSiteType || 'neutral')] || 'none';

  const h  = Math.round(pet.health    || 0);
  const hp = Math.round(pet.happiness || 0);
  document.getElementById('healthBar').style.width = h  + '%';
  document.getElementById('happyBar').style.width  = hp + '%';
  document.getElementById('healthVal').textContent = h;
  document.getElementById('happyVal').textContent  = hp;

  document.getElementById('ageVal').textContent   = pet.age || 0;
  document.getElementById('focusVal').textContent = Math.round(pet.focusMinutesToday || 0);
}

// ─── Init ─────────────────────────────────────────────────────────────────────

async function init() {
  const data = await chrome.storage.local.get('pet');

  if (!data.pet) {
    // No pet yet — onboarding hasn't been completed
    document.getElementById('stageBadge').textContent = 'open the tab to choose your pet';
    return;
  }

  updateUI(data.pet);
  tick();
  setInterval(tick, 900);
  setInterval(async () => {
    const fresh = await chrome.storage.local.get('pet');
    updateUI(fresh.pet);
  }, 10000);
}

document.getElementById('settingsBtn').addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') });
});

init();
