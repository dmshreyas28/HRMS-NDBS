import { useState } from "react";
import { Layout } from "../components/Layout";
import { PositionCard } from "../components/PositionCard";
import { usePositions, useApprovePosition, useRejectPosition } from "../hooks/usePositions";

export function ApprovalsPage() {
  const { data: positions, isLoading } = usePositions("PENDING_APPROVAL");
  const approve = useApprovePosition();
  const reject = useRejectPosition();
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const handleApprove = (id: string) => {
    approve.mutate(
      { id, notes: "Approved by admin." },
      { onError: (e) => alert(`Approve failed: ${(e as Error).message}`) }
    );
  };

  const confirmReject = (id: string) => {
    if (!reason.trim()) { alert("A reason is required to reject."); return; }
    reject.mutate(
      { id, reason },
      {
        onSuccess: () => { setRejectingId(null); setReason(""); },
        onError: (e) => alert(`Reject failed: ${(e as Error).message}`),
      }
    );
  };

  return (
    <Layout>
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">Approval Queue</h1>

      {isLoading ? (
        <p className="text-gray-500">Loading…</p>
      ) : !positions || positions.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-500">
          No positions awaiting approval.
        </p>
      ) : (
        <div className="space-y-3">
          {positions.map((p) => (
            <div key={p.id}>
              <PositionCard
                position={p}
                actions={
                  rejectingId === p.id ? (
                    <>
                      <input value={reason} onChange={(e) => setReason(e.target.value)}
                        placeholder="Reason for rejection (required)"
                        className="flex-1 rounded border border-gray-300 px-3 py-1 text-sm" autoFocus />
                      <button onClick={() => confirmReject(p.id)} disabled={reject.isPending}
                        className="rounded bg-red-600 px-3 py-1 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">
                        Confirm reject
                      </button>
                      <button onClick={() => { setRejectingId(null); setReason(""); }}
                        className="rounded border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-100">
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => handleApprove(p.id)} disabled={approve.isPending}
                        className="rounded bg-green-600 px-3 py-1 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">
                        Approve
                      </button>
                      <button onClick={() => setRejectingId(p.id)}
                        className="rounded border border-red-300 px-3 py-1 text-sm font-medium text-red-700 hover:bg-red-50">
                        Reject
                      </button>
                    </>
                  )
                }
              />
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
