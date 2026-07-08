import { useQuery } from "@tanstack/react-query";
import { useAuth0 } from "@auth0/auth0-react";
import { useAuthStore } from "../store/authStore";
import { API_BASE_URL } from "../api/client";
import type { AppUser } from "../types/models";

export function useCurrentUser(loading: boolean) {
  const { isAuthenticated, getAccessTokenSilently } = useAuth0();
  const setUser = useAuthStore((s) => s.setUser);

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const token = await getAccessTokenSilently();
      const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to load user profile");
      const body = await res.json();
      if (body.success && body.data) {
        setUser(body.data as AppUser);
        return body.data as AppUser;
      }
      throw new Error(body.error || "Failed to load current user");
    },
    enabled: isAuthenticated && !loading,
    staleTime: 300000, // 5 minutes cache
  });

  return user || useAuthStore.getState().user;
}
