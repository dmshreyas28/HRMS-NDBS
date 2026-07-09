import { POSITION_STATUS_META } from '../utils/constants';
import type { PositionStatus } from '../types/models';

export function StatusBadge({ status }: { status: PositionStatus }) {
  const meta = POSITION_STATUS_META[status] ?? { label: status, color: 'bg-slate-100 text-slate-700' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${meta.color}`}>
      {meta.label}
    </span>
  );
}

export function CandidateStageBadge({ stage }: { stage: string }) {
  const map: Record<string, string> = {
    APPLIED: 'bg-slate-100 text-slate-700',
    SCREENING: 'bg-blue-100 text-blue-800',
    INTERVIEW_SCHEDULED: 'bg-indigo-100 text-indigo-800',
    INTERVIEW_COMPLETED: 'bg-violet-100 text-violet-800',
    OFFER: 'bg-amber-100 text-amber-800',
    HIRED: 'bg-green-600 text-white',
    REJECTED: 'bg-rose-100 text-rose-800',
    WITHDRAWN: 'bg-slate-200 text-slate-600'
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${map[stage] ?? 'bg-slate-100'}`}>
      {stage.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
    </span>
  );
}
