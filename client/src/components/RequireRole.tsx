import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuthStore } from "../store/authStore";
import type { UserRole } from "../types/models";

const HOME_BY_ROLE: Record<UserRole, string> = {
  HM: "/raise",
  Admin: "/approvals",
  HR_TA: "/raise",
};

export function RequireRole({ roles, children }: { roles: UserRole[]; children: ReactNode }) {
  const user = useAuthStore((s) => s.user);
  if (!user) {
    return <div className="p-8 text-gray-600">Loading your profile…</div>;
  }
  if (!roles.includes(user.role)) {
    const home = HOME_BY_ROLE[user.role] ?? "/";
    return <Navigate to={home} replace />;
  }
  return <>{children}</>;
}
