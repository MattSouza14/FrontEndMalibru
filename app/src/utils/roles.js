export const ROLES = {
  USER: 'USER',
  SUPORTE: 'SUPORTE',
  TI: 'TI',
  RH: 'RH',
  ADMIN: 'ADMIN',
};

export function normalizeRoles(userOrRoles) {
  if (Array.isArray(userOrRoles)) {
    return userOrRoles.filter(Boolean);
  }

  if (!userOrRoles) return [ROLES.USER];

  if (Array.isArray(userOrRoles.roles)) {
    return userOrRoles.roles.filter(Boolean);
  }

  if (userOrRoles.role) {
    return [userOrRoles.role];
  }

  return [ROLES.USER];
}

export function normalizeUser(user) {
  if (!user) return null;

  const roles = normalizeRoles(user);
  return { ...user, roles };
}

export function hasRole(user, role) {
  return normalizeRoles(user).includes(role);
}

export function hasAnyRole(user, roles) {
  const userRoles = normalizeRoles(user);
  return roles.some((role) => userRoles.includes(role));
}

export function isAdmin(user) {
  return hasRole(user, ROLES.ADMIN);
}

export function canAccessChamadosAdmin(user) {
  return hasAnyRole(user, [ROLES.ADMIN, ROLES.SUPORTE, ROLES.TI]);
}

export function canAccessTiModules(user) {
  return hasAnyRole(user, [ROLES.ADMIN, ROLES.TI]);
}

export function canAccessRhModules(user) {
  return hasAnyRole(user, [ROLES.ADMIN, ROLES.RH]);
}

export function formatRoles(user, separator = ', ') {
  return normalizeRoles(user).join(separator);
}
