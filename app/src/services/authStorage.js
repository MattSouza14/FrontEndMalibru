export const TOKEN_KEY = 'valor.auth.token';
export const USER_KEY = 'valor.auth.user';

const LEGACY_TOKEN_KEY = 'token';
const LEGACY_USER_KEY = 'user';

const ALL_KEYS = [TOKEN_KEY, USER_KEY, LEGACY_TOKEN_KEY, LEGACY_USER_KEY];

export function getToken() {
  return (
    localStorage.getItem(TOKEN_KEY) ||
    sessionStorage.getItem(TOKEN_KEY) ||
    localStorage.getItem(LEGACY_TOKEN_KEY) ||
    sessionStorage.getItem(LEGACY_TOKEN_KEY)
  );
}

export function getActiveStorage() {
  if (localStorage.getItem(TOKEN_KEY) || localStorage.getItem(LEGACY_TOKEN_KEY)) {
    return localStorage;
  }
  if (sessionStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(LEGACY_TOKEN_KEY)) {
    return sessionStorage;
  }
  return localStorage;
}

export function clearAuth() {
  ALL_KEYS.forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
}

export function saveAuth({ token, user }, manterConectado = false) {
  clearAuth();
  const storage = manterConectado ? localStorage : sessionStorage;
  storage.setItem(TOKEN_KEY, token);
  storage.setItem(USER_KEY, JSON.stringify(user));
}

export function saveUser(user) {
  getActiveStorage().setItem(USER_KEY, JSON.stringify(user));
}
