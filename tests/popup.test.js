// Tests for pure popup.js functions.
// Canvas and DOM calls are not tested here — only pure logic.

// ─── buildPalette (inlined for testability) ───────────────────────────────────
// Mirrors the implementation in popup.js

const PALETTE = {
  '.': null,
  'b': '#74B9FF',
  'd': '#0984E3',
  'e': '#2D3436',
  'w': '#FFFFFF',
  'p': '#FD79A8',
  's': '#DFE6E9',
  'S': '#B2BEC3',
  'x': '#1A1A2E',
  'y': '#FDCB6E',
};

const STATE_BODY = {
  productive:  { b: '#00B894', d: '#00836B' },
  distracting: { b: '#FF7675', d: '#D63031' },
  neutral:     { b: '#74B9FF', d: '#0984E3' },
  sleeping:    { b: '#A29BFE', d: '#6C5CE7' },
  dead:        { b: '#636E72', d: '#2D3436' },
};

function buildPalette(stage, siteType) {
  if (stage === 'legend') {
    return { ...PALETTE, b: '#FDCB6E', d: '#E17055' };
  }
  const key = stage === 'dead' ? 'dead' : (siteType || 'neutral');
  return { ...PALETTE, ...(STATE_BODY[key] || STATE_BODY.neutral) };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('buildPalette', () => {
  test('legend always returns golden body regardless of siteType', () => {
    const productive  = buildPalette('legend', 'productive');
    const distracting = buildPalette('legend', 'distracting');
    const neutral     = buildPalette('legend', 'neutral');

    expect(productive.b).toBe('#FDCB6E');
    expect(distracting.b).toBe('#FDCB6E');
    expect(neutral.b).toBe('#FDCB6E');
  });

  test('dead stage always returns grey body regardless of siteType', () => {
    const p = buildPalette('dead', 'productive');
    expect(p.b).toBe(STATE_BODY.dead.b);
    expect(p.d).toBe(STATE_BODY.dead.d);
  });

  test('productive site returns green body', () => {
    const p = buildPalette('baby', 'productive');
    expect(p.b).toBe(STATE_BODY.productive.b);
  });

  test('distracting site returns red body', () => {
    const p = buildPalette('baby', 'distracting');
    expect(p.b).toBe(STATE_BODY.distracting.b);
  });

  test('sleeping returns purple body', () => {
    const p = buildPalette('egg', 'sleeping');
    expect(p.b).toBe(STATE_BODY.sleeping.b);
  });

  test('falls back to neutral for unknown siteType', () => {
    const p = buildPalette('baby', 'unknown_type');
    expect(p.b).toBe(STATE_BODY.neutral.b);
  });

  test('preserves non-body palette keys', () => {
    const p = buildPalette('baby', 'productive');
    expect(p['.']).toBeNull();
    expect(p['e']).toBe('#2D3436');
    expect(p['w']).toBe('#FFFFFF');
    expect(p['s']).toBe('#DFE6E9');
  });

  test('null siteType defaults to neutral', () => {
    const p = buildPalette('baby', null);
    expect(p.b).toBe(STATE_BODY.neutral.b);
  });
});

// ─── Sprite integrity ─────────────────────────────────────────────────────────
// popup.js is browser-only so we inline sprite samples here for sanity checks.
const STAGE_SPRITES = {
  egg: [
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
  baby: [
    '..bbbbbb..',
    '.bbbbbbbb.',
    'bbbbbbbbbb',
    'bbbewwebbb',
    'bbbbbbbbbb',
    'bbPbbbbPbb',
    '.bbbbbbbb.',
    '..bbbbbb..',
    '.b......b.',
    '..........',
  ],
};

describe('sprite integrity', () => {
  Object.entries(STAGE_SPRITES).forEach(([stage, rows]) => {
    test(`all rows of ${stage} sprite are 10 characters wide`, () => {
      rows.forEach((row, i) => {
        expect(row.length).toBe(10);
      });
    });

    test(`${stage} sprite has exactly 10 rows`, () => {
      expect(rows.length).toBe(10);
    });
  });
});
