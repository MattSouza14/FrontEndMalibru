const READ_KEY_PREFIX = 'valor.notifications.read';

function storageKey(userId) {
  return `${READ_KEY_PREFIX}.${userId ?? 'anonymous'}`;
}

function readStore(userId) {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeStore(userId, store) {
  localStorage.setItem(storageKey(userId), JSON.stringify(store));
}

export function isNotificationRead(userId, notificationId) {
  const store = readStore(userId);
  return Boolean(store[notificationId]);
}

export function markNotificationRead(userId, notificationId) {
  const store = readStore(userId);
  store[notificationId] = new Date().toISOString();
  writeStore(userId, store);
}

export function markNotificationsRead(userId, notificationIds) {
  const store = readStore(userId);
  const now = new Date().toISOString();
  notificationIds.forEach((id) => {
    store[id] = now;
  });
  writeStore(userId, store);
}

export function getChamadoReadAt(userId, chamadoId) {
  return readStore(userId)[`chamado-read-${chamadoId}`] ?? null;
}

export function markChamadoRead(userId, chamadoId, timestamp = new Date().toISOString()) {
  markNotificationRead(userId, `chamado-read-${chamadoId}`);
  markNotificationRead(userId, `chamado-novo-${chamadoId}`);
  const store = readStore(userId);
  Object.keys(store).forEach((key) => {
    if (key.startsWith(`chamado-resposta-${chamadoId}-`)) {
      store[key] = timestamp;
    }
  });
  writeStore(userId, store);
}
