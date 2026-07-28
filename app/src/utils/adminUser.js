export function getUserOfficeLicenseId(user) {
  if (!user) return null;

  const raw =
    user.officeLicenseId ??
    user.office_license_id ??
    user.licencaOfficeId ??
    user.officeLicense?.id ??
    null;

  if (raw == null || raw === '') return null;
  const parsed = Number(raw);
  return Number.isNaN(parsed) ? null : parsed;
}

export function normalizeAdminUser(user) {
  const roles = Array.isArray(user.roles)
    ? user.roles
    : user.role
      ? [user.role]
      : ['USER'];

  return {
    ...user,
    roles,
    officeLicenseId: getUserOfficeLicenseId(user),
  };
}

export function normalizeAdminUsers(users) {
  return Array.isArray(users) ? users.map(normalizeAdminUser) : [];
}
