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
  jobTitle: string;
  costCentreId: string;
  managerId: string;
  status: "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "REPLACED" | "NO_REPLACEMENT";
  reasonForLeaving?: string;
  colourCode?: "GREEN" | "RED" | "BLACK";
  createdAt: string;
}

export function listResignations(status?: string): Promise<Resignation[]> {
  const qs = status ? `?status=${status}` : "";
  return api.get<Resignation[]>(`/api/resignations${qs}`);
}

export function getResignation(id: string): Promise<Resignation> {
  return api.get<Resignation>(`/api/resignations/${id}`);
}

export function listPendingApprovals(): Promise<Resignation[]> {
  return api.get<Resignation[]>("/api/resignations/pending-approvals");
}

export function logResignation(data: {
  employeeName: string;
  employeeEmail: string;
  employeePhone: string;
  bu: string;
  department: string;
  lastSalary: number;
  jobTitle: string;
  costCentreId: string;
}): Promise<Resignation> {
  return api.post<Resignation>("/api/resignations/log", data);
}

export function approveResignation(id: string, approved: boolean): Promise<Resignation> {
  return api.post<Resignation>(`/api/resignations/approve/${id}`, { approved });
}

export function decideResignation(id: string, decision: "HIRE" | "NO_HIRE", reasonForLeaving?: string, colourCode?: string): Promise<Resignation> {
  return api.post<Resignation>(`/api/resignations/decide/${id}`, { decision, reasonForLeaving, colourCode });
}
