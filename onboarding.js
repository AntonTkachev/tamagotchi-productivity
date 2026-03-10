// Preview sprites shown on the onboarding selection screen (adult form, 10×10)
const PIXEL = 9; // 10 pixels × 9px = 90px, centered in 100px canvas

const PREVIEW_SPRITES = {
  rabbit: [
    [ // frame 0
      '.bb....bb.',
      '.bpb..bpb.',
      '.bpb..bpb.',
      'bbbbbbbbbb',
      'bbebbbbebb',
      'bbbbbbbbbb',
      'bbbbnnbbbb',
      'bbbbbbbbbb',
      '.bbbbbbbb.',
      '..bb..bb..',
    ],
    [ // frame 1 – blink
      '.bb....bb.',
      '.bpb..bpb.',
      '.bpb..bpb.',
      'bbbbbbbbbb',
      'bbbbbbbbbb',
      'bbbbbbbbbb',
      'bbbbnnbbbb',
      'bbbbbbbbbb',
      '.bbbbbbbb.',
      '..bb..bb..',
    ],
  ],
  cat: [
    [ // frame 0
      'b........b',
      '.bb....bb.',
      '.bbbbbbbb.',
      'bbbbbbbbbb',
      'bbGbbbbGbb',
      'bbbbbbbbbb',
      'bbbbpbbbbb',
      'bbbbbbbbbb',
      '.bbbbbbbb.',
      '..bb..bb..',
    ],
    [ // frame 1 – blink
      'b........b',
      '.bb....bb.',
      '.bbbbbbbb.',
      'bbbbbbbbbb',
      'bbbbbbbbbb',
      'bbbbbbbbbb',
      'bbbbpbbbbb',
      'bbbbbbbbbb',
      '.bbbbbbbb.',
      '..bb..bb..',
    ],
  ],
  dog: [
    [ // frame 0
      '..bbbbbb..',
      'ddbbbbbbdd',
      'ddbbbbbbdd',
      'ddbebbebdd',
      'ddbbbbbbdd',
      'ddbbpbbbdd',
      'ddbbrrbbdd',
      'ddbbbbbbdd',
      '..bbbbbb..',
      '.bb....bb.',
    ],
    [ // frame 1 – mouth closed
      '..bbbbbb..',
      'ddbbbbbbdd',
      'ddbbbbbbdd',
      'ddbbbbbbdd',
      'ddbbbbbbdd',
      'ddbbpbbbdd',
      'ddbbbbbbdd',
      'ddbbbbbbdd',
      '..bbbbbb..',
      '.bb....bb.',
    ],
  ],
  parrot: [
    [ // frame 0
      '..yrrrry..',
      '..bbbbbb..',
      '.bbbbbbbb.',
      '.bbebbebb.',
      '..bbkkbb..',
      '.bbbbbbbb.',
      '.bybbbbyb.',
      '.bbbbbbbb.',
      '.bb....bb.',
      '.b......b.',
    ],
    [ // frame 1 – blink
      '..yrrrry..',
      '..bbbbbb..',
      '.bbbbbbbb.',
      '.bbbbbbbb.',
      '..bbkkbb..',
      '.bbbbbbbb.',
      '.bybbbbyb.',
      '.bbbbbbbb.',
      '.bb....bb.',
      '.b......b.',
    ],
  ],
};

const ANIMAL_PALETTES = {
  rabbit: { '.':null, b:'#F5F5F5', d:'#DCDCDC', p:'#FFB3C6', n:'#FD79A8', e:'#2D3436', w:'#FFFFFF' },
  cat:    { '.':null, b:'#FDCB6E', d:'#E17055', G:'#00CEC9', p:'#FD79A8', e:'#2D3436', w:'#FFFFFF' },
  dog:    { '.':null, b:'#C8956C', d:'#8B5E3C', e:'#2D3436', p:'#FD79A8', r:'#FF7675', w:'#FFFFFF' },
  parrot: { '.':null, b:'#00B894', d:'#00836B', y:'#FDCB6E', r:'#FF6B6B', e:'#2D3436', k:'#E17055', w:'#FFFFFF' },
};

function drawSprite(canvas, rows, palette) {
  const ctx = canvas.getContext('2d');
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

// ─── Animate each preview canvas ─────────────────────────────────────────────

const animals = ['rabbit', 'cat', 'dog', 'parrot'];
const frames = { rabbit: 0, cat: 0, dog: 0, parrot: 0 };

function animateAll() {
  animals.forEach(type => {
    const canvas  = document.getElementById(`canvas-${type}`);
    const sprites = PREVIEW_SPRITES[type];
    const palette = ANIMAL_PALETTES[type];
    drawSprite(canvas, sprites[frames[type] % sprites.length], palette);
    frames[type] = (frames[type] + 1) % sprites.length;
  });
}

animateAll();
setInterval(animateAll, 900);

// ─── Selection logic ──────────────────────────────────────────────────────────

let selected = null;
const confirmBtn = document.getElementById('confirmBtn');

document.querySelectorAll('.card').forEach(card => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    selected = card.dataset.type;
    confirmBtn.classList.add('visible');
  });
});

confirmBtn.addEventListener('click', async () => {
  if (!selected) return;

  const now = Date.now();
  const pet = {
    health:            80,
    happiness:         80,
    age:               0,
    stage:             'egg',
    petType:           selected,
    bornAt:            now,
    lastUpdated:       now,
    focusMinutesToday: 0,
    lastFocusDate:     new Date(now).toDateString(),
    streak:            0,
    bestStreak:        0,
    isDead:            false,
    currentSiteType:   'neutral',
  };

  await chrome.storage.local.set({ pet });

  // Close this tab — the user can now open the extension popup
  window.close();
});
