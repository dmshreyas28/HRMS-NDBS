import { api } from "./client";
import type { Position, AuditLogEntry, PositionStatus } from "../types/models";

export function listPositions(status?: PositionStatus): Promise<Position[]> {
  const qs = status ? `?status=${status}` : "";
  return api.get<Position[]>(`/api/positions${qs}`);
}
export function getPosition(id: string): Promise<Position> { return api.get<Position>(`/api/positions/${id}`); }
export function getAuditTrail(id: string): Promise<AuditLogEntry[]> { return api.get<AuditLogEntry[]>(`/api/positions/${id}/audit`); }

export interface CreatePositionInput {
  positionType: "NEW_HIRE" | "REPLACEMENT"; costCentre: string; jobCode: string;
  division: string; jobTitle: string; reportingManager: string; jd: string;
  requiredSkills: string[]; salaryRange: { min: number; max: number; currency: string };
  requiredStartDate: string; shiftTime: string; shiftDays: string[]; location: string;
  experienceLevel: string; impactIfUnfilled: string; sittingPlace: string;
  reviewerId?: string | null; approvalSkipped: boolean; approvalSkippedReason?: string | null;
  mrfTemplateId: string; replacementDetails?: unknown;
}
export function createPosition(input: CreatePositionInput): Promise<Position> { return api.post<Position>("/api/positions", input); }

export interface UpdatePositionInput {
  costCentre: string; division: string; jobTitle: string; reportingManager: string; jd: string;
  requiredSkills: string[]; salaryRange: { min: number; max: number; currency: string };
  requiredStartDate: string; shiftTime: string; shiftDays: string[]; location: string;
  experienceLevel: string; impactIfUnfilled: string; sittingPlace: string;
  reviewerId?: string | null; replacementDetails?: unknown;
}
export function updatePosition(id: string, input: UpdatePositionInput): Promise<Position> { return api.patch<Position>(`/api/positions/${id}`, input); }
export function submitPosition(id: string, input: { reviewerId?: string | null; approvalSkipped: boolean; approvalSkippedReason?: string | null }): Promise<Position> { return api.patch<Position>(`/api/positions/${id}/submit`, input); }
export function approvePosition(id: string, notes: string): Promise<Position> { return api.patch<Position>(`/api/positions/${id}/approve`, { notes }); }
export function rejectPosition(id: string, reason: string): Promise<Position> { return api.patch<Position>(`/api/positions/${id}/reject`, { reason }); }
export function holdPosition(id: string, durationDays: number): Promise<Position> { return api.patch<Position>(`/api/positions/${id}/hold`, { durationDays }); }
export function releaseHoldPosition(id: string): Promise<Position> { return api.patch<Position>(`/api/positions/${id}/release-hold`); }
export function postJob(id: string): Promise<Position> { return api.patch<Position>(`/api/positions/${id}/post`); }
