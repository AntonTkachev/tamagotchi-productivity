// Minimal Chrome extension API mock for Jest (Node environment)

const store = {};

global.chrome = {
  storage: {
    local: {
      get: jest.fn(async (keys) => {
        if (Array.isArray(keys)) {
          return keys.reduce((acc, k) => {
            if (k in store) acc[k] = store[k];
            return acc;
          }, {});
        }
        if (typeof keys === 'string') {
          return keys in store ? { [keys]: store[keys] } : {};
        }
        return { ...store };
      }),
      set: jest.fn(async (obj) => { Object.assign(store, obj); }),
      clear: jest.fn(async () => { Object.keys(store).forEach(k => delete store[k]); }),
    },
  },
  alarms: {
    create:           jest.fn(),
    onAlarm:          { addListener: jest.fn() },
  },
  runtime: {
    onInstalled:      { addListener: jest.fn() },
    onStartup:        { addListener: jest.fn() },
    onMessage:        { addListener: jest.fn() },
    getURL:           jest.fn(path => `chrome-extension://test-id/${path}`),
  },
  tabs: {
    create: jest.fn(),
  },
  i18n: {
    getUILanguage: jest.fn(() => 'en'),
    getMessage:    jest.fn(key => key),
  },
};

// Reset store and clear mock call history between tests.
// Note: listeners captured at module load time (before this runs) are unaffected.
beforeEach(() => {
  Object.keys(store).forEach(k => delete store[k]);
  jest.clearAllMocks();
});
