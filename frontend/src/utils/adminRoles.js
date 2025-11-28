export function hasRole(user, allowedRoles) {
  // allowedRoles: array, e.g. ["super-admin", "finance"]
  if (!user?.role) return false;
  return allowedRoles.includes(user.role);
}