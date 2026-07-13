import { api } from "./client";
import type { Position } from "../types/models";

export interface HmDashboardData {
  counts: {
    draft: number;
    pending: number;
    approved: number;
    posted: number;
    onHold: number;
    filled: number;
    collapsed: number;
  };
  awaitingMyAction: Position[];
  onHold: Array<{ id: string; jobTitle: string; daysRemaining: number }>;
  openPositions: Position[];
}

export interface TaDashboardData {
  notYetPosted: Position[];
  pendingApprovals: Position[];
  pipelineSummaries: Array<{
    id: string;
    jobTitle: string;
    total: number;
    byStage: Record<string, number>;
  }>;
}

export interface AdminDashboardData {
  totalPositions: number;
  totalUsers: number;
  approachingCollapse: Array<{
    id: string;
    jobTitle: string;
    daysSince: number;
  }>;
  byStatus: Record<string, number>;
  usersByRole: Record<string, number>;
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
