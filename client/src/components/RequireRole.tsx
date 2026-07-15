import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuthStore } from "../store/authStore";
import { useAuth0 } from "@auth0/auth0-react";
import { normalizeRole } from "../utils/constants";
import type { UserRole } from "../types/models";

export function RequireRole({ roles, children }: { roles: UserRole[]; children: ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const { user: auth0User } = useAuth0();

  const rolesClaim = auth0User?.["https://hrms.app/roles"];
  const rawRole = user?.role || (Array.isArray(rolesClaim) ? rolesClaim[0] : rolesClaim);

  const role = normalizeRole(rawRole);

  if (!role) {
    return <div className="p-8 text-gray-600">Loading your profile…</div>;
  }
  if (!roles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}
