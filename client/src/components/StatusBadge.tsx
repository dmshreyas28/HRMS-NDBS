import type { PositionStatus } from "../types/models";

const STYLES: Record<PositionStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  PENDING_APPROVAL: "bg-amber-100 text-amber-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-700",
  ON_HOLD: "bg-blue-100 text-blue-700",
  POSTED: "bg-purple-100 text-purple-700",
  FILLED: "bg-emerald-100 text-emerald-800",
  COLLAPSED: "bg-zinc-200 text-zinc-600",
};

const LABELS: Record<PositionStatus, string> = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending Approval",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  ON_HOLD: "On Hold",
  POSTED: "Posted",
  FILLED: "Filled",
  COLLAPSED: "Collapsed",
};

export function StatusBadge({ status }: { status: PositionStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STYLES[status]}`}>
      {LABELS[status]}
    </span>
  );
}
