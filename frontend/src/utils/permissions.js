// Utilities to check permissions client-side (UI guard only)
export function isAdminUser(user) {
  if (!user) return false;
  const role = String(user?.role || user?.rol || user?.id_rol || "").toLowerCase();
  return role === "admin" || role === "administrador" || role === "administrator";
}

export function requireAdminOrThrow(user) {
  if (!isAdminUser(user)) {
    const err = new Error("Permisos insuficientes: se requiere rol de administrador");
    err.code = "INSUFFICIENT_PERMISSIONS";
    throw err;
  }
}

// Convenience for services: only proceed if admin (returns true/false)
export function canAssignRoles(user) {
  return isAdminUser(user);
}

export default {
  isAdminUser,
  requireAdminOrThrow,
  canAssignRoles,
};
