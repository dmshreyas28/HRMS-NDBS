import { api } from "./client";

export interface HmDashboardData {
  activePositions: number;
  pendingApprovals: number;
  drafts: number;
  inactivityWarnings: number;
  pendingResignations: number;
  recentActivities: Array<{ jobTitle: string; jobCode: string; audit: { action: string; actorId: string; timestamp: string; fromStatus: string; toStatus: string; notes: string } }>;
}

export interface TaDashboardData {
  approvedNotPosted: number;
  postedPositions: number;
  onHoldPositions: number;
  pendingApprovals: number;
  hiredThisMonth: number;
  totalCandidates: number;
}

export interface AdminDashboardData {
  totalPositions: number;
  totalUsers: number;
  totalCostCentres: number;
  totalTemplates: number;
  statusBreakdown: Record<string, number>;
}

export function getHmDashboard(): Promise<HmDashboardData> {
  return api.get<HmDashboardData>("/api/dashboard/hm");
}

export function getTaDashboard(): Promise<TaDashboardData> {
  return api.get<TaDashboardData>("/api/dashboard/ta");
}

export function getAdminDashboard(): Promise<AdminDashboardData> {
  return api.get<AdminDashboardData>("/api/dashboard/admin");
}
