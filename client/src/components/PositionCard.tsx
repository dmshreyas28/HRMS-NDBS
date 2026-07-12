import { useState } from "react";
import type { Position } from "../types/models";
import { StatusBadge } from "./StatusBadge";
import { AuditTrail } from "./AuditTrail";

interface PositionCardProps {
  position: Position;
  raisedByEmail?: string;
  actions?: React.ReactNode;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1 month ago" : `${months} months ago`;
}

export function PositionCard({ position, raisedByEmail, actions }: PositionCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-gray-900">{position.jobTitle}</h3>
            <StatusBadge status={position.status} />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {position.costCentre} · {position.division} · {position.jobCode}
          </p>
          <p className="text-xs text-gray-500">
            Raised by: {raisedByEmail ?? position.raisedBy} · {timeAgo(position.createdAt)}
          </p>
          <p className="text-xs text-gray-500">
            Salary: ₹{position.salaryRange.min.toLocaleString()} – ₹{position.salaryRange.max.toLocaleString()}{" "}
            {position.salaryRange.currency}
          </p>
        </div>
        <button
          onClick={() => setOpen((o) => !o)}
          className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-100"
        >
          {open ? "Hide details" : "View details"}
        </button>
      </div>

      {open && (
        <div className="mt-4 space-y-4 border-t border-gray-100 pt-4">
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <Detail label="Location" value={position.location} />
            <Detail label="Experience" value={position.experienceLevel} />
            <Detail label="Shift" value={`${position.shiftTime} (${position.shiftDays.join(", ")})`} />
            <Detail label="Start date" value={new Date(position.requiredStartDate).toLocaleDateString()} />
            <Detail label="Reporting manager" value={position.reportingManager || "—"} />
            <Detail label="Sitting place" value={position.sittingPlace || "—"} />
            <Detail label="Skills" value={position.requiredSkills.join(", ") || "—"} />
            <Detail label="Impact if unfilled" value={position.impactIfUnfilled || "—"} />
          </div>
          <div>
            <p className="mb-1 text-sm font-medium text-gray-700">Job Description</p>
            <p className="whitespace-pre-wrap text-sm text-gray-600">{position.jd || "—"}</p>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">Audit trail</p>
            <AuditTrail entries={position.auditLog} />
          </div>
          {actions && <div className="flex gap-2">{actions}</div>}
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-gray-400">{label}</dt>
      <dd className="text-gray-800">{value}</dd>
    </div>
  );
}
