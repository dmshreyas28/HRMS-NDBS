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

export const CANDIDATE_STAGE_META: Record<CandidateStage, { label: string; color: string }> = {
  APPLIED: { label: 'Applied', color: 'bg-slate-100 text-slate-700' },
  SCREENING: { label: 'Screening', color: 'bg-blue-100 text-blue-800' },
  INTERVIEW_SCHEDULED: { label: 'Interview Scheduled', color: 'bg-indigo-100 text-indigo-800' },
  INTERVIEW_COMPLETED: { label: 'Interview Completed', color: 'bg-violet-100 text-violet-800' },
  OFFER: { label: 'Offer', color: 'bg-amber-100 text-amber-800' },
  HIRED: { label: 'Hired', color: 'bg-green-600 text-white' },
  REJECTED: { label: 'Rejected', color: 'bg-rose-100 text-rose-800' },
  WITHDRAWN: { label: 'Withdrawn', color: 'bg-slate-200 text-slate-600' }
};

export const ROLE_META: Record<string, { label: string; color: string }> = {
  HM: { label: 'Hiring Manager', color: 'bg-blue-100 text-blue-800' },
  HR_TA: { label: 'HR / Talent Acquisition', color: 'bg-emerald-100 text-emerald-800' },
  Admin: { label: 'Admin', color: 'bg-purple-100 text-purple-800' },
};

export const COLOUR_CODE_META = {
  GREEN: { label: 'Voluntary / good standing', color: 'bg-green-100 text-green-800' },
  RED: { label: 'Performance-related', color: 'bg-rose-100 text-rose-800' },
  BLACK: { label: 'Misconduct / involuntary', color: 'bg-slate-800 text-white' }
};

export const NOTIFICATION_TYPE_META: Record<string, { label: string; color: string }> = {
  APPROVAL_REMINDER: { label: 'Approval Reminder', color: 'text-amber-600' },
  JOB_NOT_POSTED: { label: 'Job Not Posted', color: 'text-orange-600' },
  POSITION_HOLD_EXPIRY: { label: 'Hold Expiry', color: 'text-purple-600' },
  COLLAPSE_WARNING: { label: 'Collapse Warning', color: 'text-red-600' },
  POSITION_COLLAPSED: { label: 'Position Collapsed', color: 'text-red-700' },
  RESIGNATION_ACTION: { label: 'Resignation Action', color: 'text-blue-600' },
  POSITION_APPROVED: { label: 'Position Approved', color: 'text-green-600' },
  POSITION_REJECTED: { label: 'Position Rejected', color: 'text-rose-600' },
  POSITION_FILLED: { label: 'Position Filled', color: 'text-green-700' }
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

export function daysBetween(from: string | Date, to: string | Date): number {
  const f = typeof from === 'string' ? new Date(from) : from;
  const t = typeof to === 'string' ? new Date(to) : to;
  return Math.floor((t.getTime() - f.getTime()) / (1000 * 60 * 60 * 24));
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
