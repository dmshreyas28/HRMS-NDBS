import type { PositionStatus, UserRole } from '../types/models';

export const POSITION_STATUS_META: Record<PositionStatus, { label: string; color: string }> = {
  DRAFT: { label: 'Draft', color: 'bg-slate-100 text-slate-700' },
  PENDING_APPROVAL: { label: 'Pending Approval', color: 'bg-amber-100 text-amber-800' },
  APPROVED: { label: 'Approved', color: 'bg-blue-100 text-blue-800' },
  REJECTED: { label: 'Rejected', color: 'bg-rose-100 text-rose-800' },
  ON_HOLD: { label: 'On Hold', color: 'bg-purple-100 text-purple-800' },
  POSTED: { label: 'Posted', color: 'bg-emerald-100 text-emerald-800' },
  FILLED: { label: 'Filled', color: 'bg-green-600 text-white' },
  COLLAPSED: { label: 'Collapsed', color: 'bg-slate-300 text-slate-700 line-through' }
};

export const CANDIDATE_STAGES = [
  'APPLIED', 'SCREENING', 'INTERVIEW_SCHEDULED', 'INTERVIEW_COMPLETED',
  'OFFER', 'HIRED', 'REJECTED', 'WITHDRAWN'
] as const;

export type CandidateStage = typeof CANDIDATE_STAGES[number];

export const ROLE_META: Record<string, { label: string; color: string }> = {
  HM: { label: 'Hiring Manager', color: 'bg-blue-100 text-blue-800' },
  HR_TA: { label: 'HR / Talent Acquisition', color: 'bg-emerald-100 text-emerald-800' },
  Admin: { label: 'Admin', color: 'bg-purple-100 text-purple-800' },
};

export function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }); }
  catch { return iso; }
}

export function formatDateTime(iso?: string | null): string {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch { return iso; }
}

export const uploadsBase = import.meta.env.VITE_API_BASE_URL || '';

export function normalizeRole(rawRole: string | undefined | null): UserRole | undefined {
  if (!rawRole) return undefined;
  const lower = rawRole.toLowerCase();
  if (lower === "hm") return "HM";
  if (lower === "hr_ta" || lower === "hr/ta") return "HR_TA";
  if (lower === "admin") return "Admin";
  return undefined;
}
