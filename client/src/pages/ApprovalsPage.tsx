import { useState } from "react";
import { Layout } from "../components/Layout";
import { PositionCard } from "../components/PositionCard";
import { usePositions, useApprovePosition, useRejectPosition } from "../hooks/usePositions";
import { PageHeader, Spinner, EmptyState, Button, Input } from '../components/ui';

export function ApprovalsPage() {
  const { data: positions, isLoading } = usePositions("PENDING_APPROVAL");
  const approve = useApprovePosition();
  const reject = useRejectPosition();
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const handleApprove = (id: string) => {
    approve.mutate(
      { id, notes: "Approved." },
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
      <PageHeader
        title="Approval Queue"
        subtitle="Review and sign-off pending headcount requisitions"
      />

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : !positions || positions.length === 0 ? (
        <EmptyState title="No positions awaiting approval" hint="You are all caught up!" />
      ) : (
        <div className="space-y-3">
          {positions.map((p) => (
            <div key={p.id}>
              <PositionCard
                position={p}
                actions={
                  rejectingId === p.id ? (
                    <div className="flex items-center gap-2 w-full mt-2 border-t pt-3">
                      <Input
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Reason for rejection (required)"
                        className="flex-1"
                        autoFocus
                      />
                      <Button onClick={() => confirmReject(p.id)} disabled={reject.isPending} variant="danger" className="py-1 px-3 text-xs">
                        Confirm Reject
                      </Button>
                      <Button onClick={() => { setRejectingId(null); setReason(""); }} variant="secondary" className="py-1 px-3 text-xs">
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2 mt-2 border-t pt-3">
                      <Button onClick={() => handleApprove(p.id)} disabled={approve.isPending} variant="primary" className="py-1 px-3 text-xs">
                        Approve
                      </Button>
                      <Button onClick={() => setRejectingId(p.id)} variant="danger" className="py-1 px-3 text-xs">
                        Reject
                      </Button>
                    </div>
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
