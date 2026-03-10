# Productivity Tamagotchi — Chrome Extension

A virtual pixel-art pet that grows when you're productive and suffers when you procrastinate.

---

## Project structure

```
tamagotchi-productivity/
├── manifest.json           # Chrome MV3 manifest (default_locale: "en")
├── background.js           # Service worker — alarm tick, site tracking
├── content.js              # Reports current hostname to background
├── petLogic.js             # Pure business logic (no Chrome API deps)
├── popup.html / popup.js   # Extension popup — pixel canvas + stats UI
├── settings.html / settings.js  # Settings page — manage sites, reset pet
├── onboarding.html / onboarding.js  # First-launch pet selection screen
├── i18n.js                 # Shared i18n helper (data-i18n, RTL, t())
├── _locales/               # Chrome i18n translation files
│   ├── en/messages.json
│   ├── ru/messages.json
│   ├── es/messages.json
│   └── ar/messages.json
├── generate_icons.py       # Generates icon16/48/128.png (no external deps)
├── jest.setup.js           # Chrome API mock for Jest
├── package.json            # Jest config
└── tests/
    ├── petLogic.test.js
    ├── background.test.js
    ├── popup.test.js
    ├── onboarding.test.js
    └── i18n.test.js
```

---

## Architecture

### petLogic.js — core pure logic

No browser/Chrome dependencies. Used by both background.js (`importScripts`) and the test suite (`require`).

Key functions:
- `createDefaultPet()` → fresh pet object (no petType — set by onboarding)
- `getStage(ageDays, health, isDead)` → stage string
- `categorizeSite(hostname, settings, siteTimestamp, now)` → `'productive' | 'distracting' | 'neutral'`
- `computeStatUpdate(pet, settings, currentSite, siteTimestamp, now)` → `{ pet, skipped }`
- `cleanHostname(raw)` → bare hostname string

### background.js — service worker

Thin wrapper. Loads petLogic via `importScripts`, wires Chrome events, calls `computeStatUpdate`, saves to `chrome.storage.local`.

On first install: opens `onboarding.html` tab (does NOT create pet — onboarding does that).

### onboarding.js — pet selection

Shown once on first install. Animates preview sprites (adult form) for all 4 animals. On confirm:
- Creates pet object with `petType` field
- Saves to `chrome.storage.local`
- Calls `window.close()`

### popup.js — canvas renderer

Reads storage, renders 10×10 pixel-art sprites scaled to 140px via Canvas `fillRect`. Uses per-animal palettes and a glow (box-shadow) system to show state.

Key structures:
- `BASE_PALETTE` — shared chars (egg shell, eyes, sparkle)
- `ANIMAL_PALETTES` — per-animal body/detail colours
- `SHARED_SPRITES` — egg + dead (same for all animals)
- `ANIMAL_SPRITES` — baby/teen/adult/legend per animal, 2 frames each
- `GLOW` — box-shadow values per site type
- `buildPalette(stage, petType)` — merges BASE + animal palette; dead overrides body to grey
- `getSprites(stage, petType)` — returns correct sprite array

### i18n.js — shared helper

Included in every HTML page. Auto-runs on DOMContentLoaded.
- Replaces `[data-i18n]` element text using `chrome.i18n.getMessage`
- Replaces `[data-i18n-placeholder]` input placeholders
- Sets `dir="rtl"` automatically for Arabic locale
- Exports `t(key)` shorthand (falls back to key if no translation)

### _locales/ — translations

Four languages: `en`, `ru`, `es`, `ar`. Loaded by Chrome's built-in i18n system. Manifest uses `__MSG_ext_name__` and `__MSG_ext_description__`.

---

## Pet mechanics

| Site type   | Health / tick | Happiness / tick | Focus min |
|-------------|--------------|-----------------|-----------|
| Productive  | +2           | +1              | +5 min    |
| Distracting | -3           | -2              | —         |
| Neutral     | +0.5         | +0.3            | —         |

- Tick fires every **5 minutes** via `chrome.alarms`
- Absence > 8 hours → treated as sleep, no stat change
- Health hits 0 → pet dies; visiting a productive site revives it with health=10
- **Streak**: increments each day you had `focusMinutesToday > 0`; resets to 0 on missed days; `bestStreak` tracks all-time record and never decreases

### Stage progression

| Stage  | Age (days) | Health threshold |
|--------|-----------|-----------------|
| Egg    | 0–2       | any             |
| Baby   | 3–7       | > 20            |
| Teen   | 8–20      | > 30            |
| Adult  | 21–59     | > 40            |
| Legend | 60+       | > 60            |

Unhealthy pets regress to the previous stage.

### Pet types

| Type   | Body colour | Accent                       |
|--------|------------|------------------------------|
| Rabbit | White       | Pink inner ears, pink nose   |
| Cat    | Gold        | Teal eyes, pink nose         |
| Dog    | Brown       | Dark ears, pink nose, red tongue |
| Parrot | Green       | Yellow crest, red feathers, orange beak |

---

## Running tests

Requires Node.js (`brew install node` if not installed).

```bash
npm install
npm test           # run all tests
npm run test:watch # watch mode
npm run test:cov   # with coverage report
```

### Test structure

- **petLogic.test.js** — unit tests for all pure functions, including streak increment/reset/bestStreak
- **background.test.js** — Chrome event handler wiring (onInstalled → opens onboarding tab, tick alarm, SITE_VISIT messages)
- **popup.test.js** — `buildPalette(stage, petType)` animal palettes, dead override, sprite grid integrity
- **onboarding.test.js** — pet object structure on creation (including streak/bestStreak), palette consistency
- **i18n.test.js** — `t()` fallback behaviour, RTL detection in `initI18n()`

### Important: listener capture in background.test.js

`background.js` registers listeners at module load time. `jest.clearAllMocks()` in `beforeEach` clears `mock.calls`, so listener references are captured immediately after `require('../background')` — before any `beforeEach` runs.

---

## Installing the extension

1. Open `chrome://extensions/`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked** → select this folder
4. Pin the extension; open a new tab to trigger the onboarding screen

---

## Common tasks

**Add a new animal type** → add palette to `ANIMAL_PALETTES` in both `popup.js` and `onboarding.js`, add sprite frames to `ANIMAL_SPRITES`, add a card to `onboarding.html`, add i18n keys to all `_locales/*/messages.json`.

**Add a new stage** → update `getStage()` in `petLogic.js`, add sprite frames in `popup.js` under the new stage key, add `stage_<name>` i18n key to all locales.

**Change stat rates** → edit `computeStatUpdate()` in `petLogic.js` and update the corresponding test expectations in `petLogic.test.js`.

**Add a new language** → create `_locales/<locale>/messages.json` with all keys from `en/messages.json` translated. If RTL, `i18n.js` handles `dir="rtl"` automatically for any locale starting with `ar`.

**Add a new default site** → edit `DEFAULT_SETTINGS` in `petLogic.js` (single source of truth used by both background.js and settings.js).

---

## Dev mode

Enable the dev panel in Settings by setting `DEV_MODE = true` in `dev-config.js`. The file is marked `assume-unchanged` in git so changes won't be committed.

Dev panel controls: stage buttons, health/happiness sliders, age input, site type simulator.
