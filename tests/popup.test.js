// Tests for pure popup.js functions.
// Canvas and DOM calls are not tested here — only pure logic.
// Functions are inlined here because popup.js targets the browser environment.

// ─── Palette definitions (mirrored from popup.js) ─────────────────────────────

const BASE_PALETTE = {
  '.': null,
  's': '#DFE6E9',
  'S': '#B2BEC3',
  'e': '#2D3436',
  'x': '#1A1A2E',
  'y': '#FDCB6E',
};

const ANIMAL_PALETTES = {
  rabbit: { b:'#F5F5F5', d:'#DCDCDC', p:'#FFB3C6', n:'#FD79A8', e:'#2D3436', w:'#FFFFFF' },
  cat:    { b:'#FDCB6E', d:'#E17055', G:'#00CEC9', p:'#FD79A8', e:'#2D3436', w:'#FFFFFF' },
  dog:    { b:'#C8956C', d:'#8B5E3C', e:'#2D3436', p:'#FD79A8', r:'#FF7675', w:'#FFFFFF' },
  parrot: { b:'#00B894', d:'#00836B', y:'#FDCB6E', r:'#FF6B6B', e:'#2D3436', k:'#E17055', w:'#FFFFFF' },
};

function buildPalette(stage, petType) {
  const animal = ANIMAL_PALETTES[petType] || ANIMAL_PALETTES.rabbit;
  const base   = { ...BASE_PALETTE, ...animal };
  if (stage === 'dead') {
    return { ...base, b: '#636E72', d: '#2D3436' };
  }
  return base;
}

// ─── buildPalette tests ───────────────────────────────────────────────────────

describe('buildPalette — animal body colours', () => {
  test('rabbit has white body (#F5F5F5)', () => {
    expect(buildPalette('adult', 'rabbit').b).toBe('#F5F5F5');
  });

  test('cat has golden body (#FDCB6E)', () => {
    expect(buildPalette('adult', 'cat').b).toBe('#FDCB6E');
  });

  test('dog has brown body (#C8956C)', () => {
    expect(buildPalette('adult', 'dog').b).toBe('#C8956C');
  });

  test('parrot has green body (#00B894)', () => {
    expect(buildPalette('adult', 'parrot').b).toBe('#00B894');
  });

  test('unknown petType falls back to rabbit palette', () => {
    expect(buildPalette('adult', 'dragon').b).toBe('#F5F5F5');
  });
});

describe('buildPalette — dead stage override', () => {
  const DEAD_BODY = '#636E72';
  const DEAD_DARK = '#2D3436';

  test.each(['rabbit', 'cat', 'dog', 'parrot'])(
    'dead %s has grey body',
    (petType) => {
      const p = buildPalette('dead', petType);
      expect(p.b).toBe(DEAD_BODY);
      expect(p.d).toBe(DEAD_DARK);
    }
  );

  test('dead stage overrides natural body colour', () => {
    const alive = buildPalette('adult', 'parrot');
    const dead  = buildPalette('dead',  'parrot');
    expect(alive.b).toBe('#00B894'); // green when alive
    expect(dead.b).toBe(DEAD_BODY);  // grey when dead
  });
});

describe('buildPalette — palette key preservation', () => {
  test('BASE_PALETTE transparent pixel is preserved', () => {
    expect(buildPalette('baby', 'rabbit')['.']).toBeNull();
  });

  test('eye colour is always dark', () => {
    expect(buildPalette('adult', 'rabbit').e).toBe('#2D3436');
    expect(buildPalette('adult', 'cat').e).toBe('#2D3436');
    expect(buildPalette('dead',  'rabbit').e).toBe('#2D3436');
  });

  test('egg shell colours come from BASE_PALETTE', () => {
    const p = buildPalette('egg', 'rabbit');
    expect(p.s).toBe('#DFE6E9');
    expect(p.S).toBe('#B2BEC3');
  });

  test('rabbit palette includes inner-ear colour', () => {
    expect(buildPalette('teen', 'rabbit').n).toBe('#FD79A8');
  });

  test('cat palette includes teal eye colour', () => {
    expect(buildPalette('teen', 'cat').G).toBe('#00CEC9');
  });

  test('parrot palette includes beak colour', () => {
    expect(buildPalette('teen', 'parrot').k).toBe('#E17055');
  });
});

// ─── Sprite integrity ─────────────────────────────────────────────────────────
// Inline sprite samples from popup.js SHARED_SPRITES and ANIMAL_SPRITES.
// Verifies the 10×10 grid contract without importing browser-only code.

const SPRITES_TO_CHECK = {
  'shared:egg frame0': [
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
  'shared:egg frame1 (blink)': [
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
  'rabbit:baby frame0': [
    '..bb..bb..',
    '.bbbbbbbb.',
    'bbbbbbbbbb',
    'bbebbbbebb',
    'bbbbbbbbbb',
    'bbbbnnbbbb',
    '.bbbbbbbb.',
    '..bbbbbb..',
    '.b......b.',
    '..........',
  ],
  'rabbit:legend frame0': [
    'y.bb..bb.y',
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
  'parrot:adult frame0': [
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
  'dog:teen frame0': [
    '..bbbbbb..',
    'ddbbbbbbdd',
    'ddbbbbbbdd',
    'ddbebbebdd',
    'ddbbbbbbdd',
    'ddbbpbbbdd',
    'ddbbrrbbdd',
    'ddbbbbbbdd',
    '..bbbbbb..',
    '.b......b.',
  ],
};

describe('sprite grid integrity', () => {
  Object.entries(SPRITES_TO_CHECK).forEach(([name, rows]) => {
    test(`${name} has exactly 10 rows`, () => {
      expect(rows.length).toBe(10);
    });

    test(`${name} — all rows are 10 chars wide`, () => {
      rows.forEach((row, i) => {
        expect(row.length).toBe(10);
      });
    });
  });
});
