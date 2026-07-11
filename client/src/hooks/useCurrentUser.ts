import { useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useAuthStore } from "../store/authStore";
import { API_BASE_URL } from "../api/client";
import type { AppUser } from "../types/models";

export function useCurrentUser(loading: boolean) {
  const { isAuthenticated, getAccessTokenSilently } = useAuth0();
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!isAuthenticated || loading) return;
      try {
        const token = await getAccessTokenSilently();
        const res = await fetch(`${API_BASE_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
        const body = await res.json();
        if (!cancelled && body.success && body.data) { setUser(body.data as AppUser); }
      } catch (e) { console.error("Failed to load current user:", e); }
    };
    load();
    return () => { cancelled = true; };
  }, [isAuthenticated, loading, getAccessTokenSilently, setUser]);

  return user;
}
