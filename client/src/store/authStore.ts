import { create } from "zustand";
import type { AppUser } from "../types/models";
interface AuthState { user: AppUser | null; setUser: (user: AppUser | null) => void; clear: () => void; }
export const useAuthStore = create<AuthState>((set) => ({ user: null, setUser: (user) => set({ user }), clear: () => set({ user: null }) }));
