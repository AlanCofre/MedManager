import { requireAdminOrThrow } from "../utils/permissions";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export async function changeUserRole(currentUser, targetUserId, newRole) {
  // Client-side guard: only admins should call this
  requireAdminOrThrow(currentUser);

  const token = localStorage.getItem("token") || sessionStorage.getItem("token");

  const res = await fetch(`${API_BASE}/usuarios/${targetUserId}/rol`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({ rol: newRole }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.mensaje || data?.error || `Error ${res.status}`);
    err.status = res.status;
    throw err;
  }

  return data;
}

export default { changeUserRole };
