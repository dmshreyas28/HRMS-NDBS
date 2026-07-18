import { api } from "./client";

export interface DoAEntry {
  id: string;
  name: string;
  email: string;
  title: string;
  isActive: boolean;
}

export function listDoa(): Promise<DoAEntry[]> {
  return api.get<DoAEntry[]>("/api/doa");
}

export function createDoa(entry: Omit<DoAEntry, "id">): Promise<DoAEntry> {
  return api.post<DoAEntry>("/api/doa", entry);
}

export function updateDoa(id: string, entry: Partial<DoAEntry>): Promise<DoAEntry> {
  return api.put<DoAEntry>(`/api/doa/${id}`, entry);
}
