import { api } from "./client";
import type { AppUser } from "../types/models";

export function listUsers(): Promise<AppUser[]> {
  return api.get<AppUser[]>("/api/users");
}

export function createUser(user: Omit<AppUser, "id">): Promise<AppUser> {
  return api.post<AppUser>("/api/users", user);
}

export function updateUser(id: string, user: Partial<AppUser>): Promise<AppUser> {
  return api.patch<AppUser>(`/api/users/${id}`, user);
}

export function deleteUser(id: string): Promise<void> {
  return api.delete<void>(`/api/users/${id}`);
}
