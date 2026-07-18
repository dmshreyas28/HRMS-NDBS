import type { AuditLogEntry } from "../types/models";
import { formatDateTime } from "../utils/constants";

export function AuditTrail({ entries }: { entries: AuditLogEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-sm text-gray-500">No audit entries yet.</p>;
  }

  const sorted = [...entries].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <ol className="space-y-3">
      {sorted.map((e, i) => (
        <li key={i} className="flex gap-3 text-sm">
          <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-indigo-400" />
          <div>
            <p className="text-gray-900">
              <span className="font-medium">{e.action}</span>
              <span className="text-gray-500"> · {e.fromStatus} → {e.toStatus}</span>
            </p>
            <p className="text-xs text-gray-500">
              {formatDateTime(e.timestamp)} · by {e.actorId}
            </p>
            {e.notes && <p className="mt-0.5 text-xs text-gray-600">{e.notes}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
