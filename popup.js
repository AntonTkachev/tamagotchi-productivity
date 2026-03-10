const PIXEL = 14; // px per sprite pixel → 10×10 sprite = 140×140px on 160×160 canvas

const PALETTE = {
  '.': null,
  'b': '#74B9FF', // body (blue, default)
  'd': '#0984E3', // dark body accent
  'e': '#2D3436', // eye dark
  'w': '#FFFFFF', // eye white

  'p': '#FD79A8', // cheek pink
  's': '#DFE6E9', // egg shell
  'S': '#B2BEC3', // egg shell dark
  'x': '#1A1A2E', // dead X-eye
  'y': '#FDCB6E', // sparkle gold
};

// Body color overrides per site type
const STATE_BODY = {
  productive:  { b: '#00B894', d: '#00836B' },
  distracting: { b: '#FF7675', d: '#D63031' },
  neutral:     { b: '#74B9FF', d: '#0984E3' },
  sleeping:    { b: '#A29BFE', d: '#6C5CE7' },
  dead:        { b: '#636E72', d: '#2D3436' },
};

// ─── Sprites (10 wide × 10 tall) ──────────────────────────────────────────────
const SPRITES = {
  egg: [
    [ // frame 0 – eyes open
      '..ssssss..',
      '.ssssssss.',
      'ssssssssss',
      'ssseSsesss', // eyes at 3,6
      'ssssssssss',
      'ssPssssPss', // cheeks at 2,7
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

  baby: [
    [ // frame 0 – eyes open
      '..bbbbbb..',
      '.bbbbbbbb.',
      'bbbbbbbbbb',
      'bbbewwebbb', // eyes at 3,6; whites at 4,5
      'bbbbbbbbbb',
      'bbPbbbbPbb', // cheeks at 2,7
      '.bbbbbbbb.',
      '..bbbbbb..',
      '.b......b.',
      '..........',
    ],
    [ // frame 1 – blink
      '..bbbbbb..',
      '.bbbbbbbb.',
      'bbbbbbbbbb',
      'bbbbbbbbbb',
      'bbbbbbbbbb',
      'bbPbbbbPbb',
      '.bbbbbbbb.',
      '..bbbbbb..',
      '.b......b.',
      '..........',
    ],
  ],

  teen: [
    [ // frame 0
      '.bbbbbbb..',
      'bbbbbbbbbb',
      'bbbbbbbbbb',
      'bbbewwebbb',
      'bbbbbbbbbb',
      'bbPbbbbPbb',
      'bbbbbbbbbb',
      '.bbbbbbbb.',
      '.b......b.',
      '..........',
    ],
    [ // frame 1 – blink
      '.bbbbbbb..',
      'bbbbbbbbbb',
      'bbbbbbbbbb',
      'bbbbbbbbbb',
      'bbbbbbbbbb',
      'bbPbbbbPbb',
      'bbbbbbbbbb',
      '.bbbbbbbb.',
      '.b......b.',
      '..........',
    ],
  ],

  adult: [
    [ // frame 0
      '.bbbbbbbb.',
      'dbbbbbbbbd',
      'bbbbbbbbbb',
      'bbbewwebbb',
      'bbbbbbbbbb',
      'bbPbbbbPbb',
      'bbbbbbbbbb',
      'dbbbbbbbbd',
      '.b......b.',
      '..........',
    ],
    [ // frame 1 – blink
      '.bbbbbbbb.',
      'dbbbbbbbbd',
      'bbbbbbbbbb',
      'bbbbbbbbbb',
      'bbbbbbbbbb',
      'bbPbbbbPbb',
      'bbbbbbbbbb',
      'dbbbbbbbbd',
      '.b......b.',
      '..........',
    ],
  ],

  legend: [
    [ // frame 0 – sparkles up
      'y.bbbbbb.y',
      '.bbbbbbbb.',
      'bbbbbbbbbb',
      'bbbewwebbb',
      'bbbbbbbbbb',
      'bbPbbbbPbb',
      'bbbbbbbbbb',
      'dbbbbbbbbd',
      '.b......b.',
      '..........',
    ],
    [ // frame 1 – sparkles shift + blink
      '.y.bbbb.y.',
      '.bbbbbbbb.',
      'bbbbbbbbbb',
      'bbbbbbbbbb',
      'bbbbbbbbbb',
      'bbPbbbbPbb',
      'bbbbbbbbbb',
      'dbbbbbbbbd',
      '.b......b.',
      '..........',
    ],
  ],

  dead: [
    [ // frame 0
      '..........',
      '..bbbbbb..',
      '.bbbbbbbb.',
      'bbbbbbbbbb',
      'bbbxbbxbbb', // X eyes at 3,6
      'bbbbbbbbbb',
      '.bbbbbbbb.',
      '..bbbbbb..',
      '.b......b.',
      '..........',
    ],
    [ // frame 1 – same (no animation when dead)
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

// ─── Drawing ──────────────────────────────────────────────────────────────────
const canvas = document.getElementById('petCanvas');
const ctx = canvas.getContext('2d');

function buildPalette(stage, siteType) {
  if (stage === 'legend') {
    return { ...PALETTE, b: '#FDCB6E', d: '#E17055' };
  }
  const key = stage === 'dead' ? 'dead' : (siteType || 'neutral');
  return { ...PALETTE, ...(STATE_BODY[key] || STATE_BODY.neutral) };
}

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
let pet = null;
let frame = 0;

function tick() {
  if (!pet) return;
  const stage = pet.stage || 'egg';
  const frames = SPRITES[stage] || SPRITES.egg;
  drawSprite(frames[frame % frames.length], buildPalette(stage, pet.currentSiteType));
  frame = (frame + 1) % frames.length;
}

// ─── UI update ────────────────────────────────────────────────────────────────
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

  document.getElementById('stageBadge').textContent =
    STAGE_LABELS[pet.stage] || STAGE_LABELS.egg;

  document.getElementById('deadOverlay').classList.toggle(
    'visible', !!pet.isDead
  );

  document.getElementById('mood').textContent =
    MOOD_LABELS[pet.currentSiteType] || MOOD_LABELS.neutral;

  const h = Math.round(pet.health || 0);
  const hp = Math.round(pet.happiness || 0);

  document.getElementById('healthBar').style.width = h + '%';
  document.getElementById('happyBar').style.width  = hp + '%';
  document.getElementById('healthVal').textContent = h;
  document.getElementById('happyVal').textContent  = hp;

  document.getElementById('ageVal').textContent   = pet.age || 0;
  document.getElementById('focusVal').textContent = Math.round(pet.focusMinutesToday || 0);
}

// ─── Init ─────────────────────────────────────────────────────────────────────
async function init() {
  const data = await chrome.storage.local.get('pet');
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
