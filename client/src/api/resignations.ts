import { api } from "./client";

export interface Resignation {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  employeePhone: string;
  bu: string;
  department: string;
  lastSalary: number;
  managerId: string;
  status: "PENDING_ACTION" | "REPLACED" | "NO_REPLACEMENT";
  reasonForLeaving?: string;
  colourCode?: "GREEN" | "RED" | "BLACK";
  createdAt: string;
}

export function listResignations(): Promise<Resignation[]> {
  return api.get<Resignation[]>("/api/resignations");
}

export function getResignation(id: string): Promise<Resignation> {
  return api.get<Resignation>(`/api/resignations/${id}`);
}

export function decideResignation(id: string, decision: "HIRE" | "NO_HIRE", reasonForLeaving?: string, colourCode?: string): Promise<Resignation> {
  return api.post<Resignation>(`/api/resignations/decide/${id}`, { decision, reasonForLeaving, colourCode });
}

export function simulateResignation(resignation: Omit<Resignation, "id" | "createdAt" | "status">): Promise<Resignation> {
  return api.post<Resignation>("/api/resignations/simulate", resignation);
}
