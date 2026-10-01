const Storage = {
  getJSON(key, fallback = null) {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },

  setJSON(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore storage failures in restricted/private environments.
    }
  },

  remove(key) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Ignore storage failures in restricted/private environments.
    }
  },
};

export default Storage;
