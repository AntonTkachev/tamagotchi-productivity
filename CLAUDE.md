# Productivity Tamagotchi — Chrome Extension

A virtual pixel-art pet that grows when you're productive and suffers when you procrastinate.

---

## Project structure

```
tamagotchi-productivity/
├── manifest.json        # Chrome MV3 manifest
├── background.js        # Service worker — alarm tick, site tracking
├── content.js           # Reports current hostname to background
├── popup.html/js        # Extension popup — pixel canvas + stats UI
├── settings.html/js     # Settings page — manage productive/distracting sites
├── petLogic.js          # Pure business logic (no Chrome API deps)
└── __tests__/           # Jest unit tests
    ├── petLogic.test.js
    ├── background.test.js
    └── popup.test.js
```

---

## Architecture

**petLogic.js** is the core module. It contains all pure functions with zero browser/Chrome dependencies. Both background.js (via `importScripts`) and the test suite (via `require`) use it.

Key functions:
- `getStage(ageDays, health, isDead)` → stage string
- `categorizeSite(hostname, settings, siteTimestamp, now)` → `'productive' | 'distracting' | 'neutral'`
- `computeStatUpdate(pet, settings, currentSite, siteTimestamp, now)` → `{ pet, skipped }`
- `cleanHostname(raw)` → bare hostname string
- `createDefaultPet()` → fresh pet object

**background.js** is a thin wrapper — loads petLogic via `importScripts`, wires Chrome events, calls `computeStatUpdate`, saves to `chrome.storage.local`.

**popup.js** reads storage and renders pixel-art sprites on Canvas. Colors shift based on current site type (green = productive, red = distracting). Legend stage always renders gold.

---

## Pet mechanics

| Site type   | Health / tick | Happiness / tick | Focus min |
|-------------|--------------|-----------------|-----------|
| Productive  | +2           | +1              | +5 min    |
| Distracting | -3           | -2              | —         |
| Neutral     | -0.5         | -0.3            | —         |

- Tick fires every **5 minutes** via `chrome.alarms`
- Absence > 8 hours → treated as sleep, no stat change
- Health hits 0 → pet dies; visiting a productive site revives it with health=10

### Stage progression

| Stage  | Age (days) | Health threshold |
|--------|-----------|-----------------|
| Egg    | 0–2       | any             |
| Baby   | 3–7       | > 20            |
| Teen   | 8–20      | > 30            |
| Adult  | 21–59     | > 40            |
| Legend | 60+       | > 60            |

Unhealthy pets regress to previous stage.

---

## Running tests

Requires Node.js (not installed by default on this machine — install via `brew install node`).

```bash
npm install
npm test           # run all tests
npm run test:watch # watch mode
npm run test:cov   # with coverage report
```

### Test structure

- **petLogic.test.js** — comprehensive unit tests for all pure functions (getStage, categorizeSite, computeStatUpdate, cleanHostname, createDefaultPet)
- **background.test.js** — integration tests for Chrome event handler wiring; Chrome APIs are mocked in `jest.setup.js`
- **popup.test.js** — tests for `buildPalette` colour logic and sprite row integrity

---

## Installing the extension

1. Open `chrome://extensions/`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked** → select this folder
4. Pin the extension for easy access

---

## Adding new sprites

Sprites are defined in `popup.js` as `SPRITES[stageName]` — arrays of string frames (10 chars × 10 rows). Each char maps to a colour in `PALETTE`. Transparent pixels use `'.'`.

Body colour (`'b'`) is dynamically overridden based on site type via `STATE_BODY` in `buildPalette()`. Don't hard-code body colours in sprites.

---

## Common tasks

**Add a new stage** → update `getStage()` in `petLogic.js`, add sprite frames in `popup.js`, add label in `STAGE_LABELS`.

**Change stat rates** → edit `computeStatUpdate()` in `petLogic.js` and update the corresponding test expectations in `petLogic.test.js`.

**Add a new default site** → edit `DEFAULT_SETTINGS` in `petLogic.js` (single source of truth — background.js and settings.js both use it).
