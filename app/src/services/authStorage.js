export const USER_KEY = 'valor.auth.user';

const LEGACY_TOKEN_KEY = 'token';
const LEGACY_USER_KEY = 'user';
const LEGACY_TOKEN_KEY_NAMED = 'valor.auth.token';

const LEGACY_KEYS = [LEGACY_TOKEN_KEY_NAMED, LEGACY_TOKEN_KEY, LEGACY_USER_KEY];

export function getStoredUser() {
  const raw =
    localStorage.getItem(USER_KEY) ||
    sessionStorage.getItem(USER_KEY) ||
    localStorage.getItem(LEGACY_USER_KEY) ||
    sessionStorage.getItem(LEGACY_USER_KEY);

  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getActiveStorage() {
  if (localStorage.getItem(USER_KEY) || localStorage.getItem(LEGACY_USER_KEY)) {
    return localStorage;
  }
  if (sessionStorage.getItem(USER_KEY) || sessionStorage.getItem(LEGACY_USER_KEY)) {
    return sessionStorage;
  }
  return sessionStorage;
}

export function clearAuth() {
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(USER_KEY);
  LEGACY_KEYS.forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
}

export function saveUser(user, persistent = false) {
  clearAuth();
  const storage = persistent ? localStorage : sessionStorage;
  storage.setItem(USER_KEY, JSON.stringify(user));
}

export function saveUserProfile(user) {
  getActiveStorage().setItem(USER_KEY, JSON.stringify(user));
}

/** @deprecated JWT não é mais armazenado no cliente. Mantido por compatibilidade. */
export function getToken() {
  return null;
}
