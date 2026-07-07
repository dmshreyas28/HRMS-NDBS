import { useNavigate } from "react-router-dom";
import { Layout } from "../components/Layout";
import { StatusBadge } from "../components/StatusBadge";
import { PositionCard } from "../components/PositionCard";
import { usePositions, useCreateDraft } from "../hooks/usePositions";
import { useAuthStore } from "../store/authStore";
import type { Position } from "../types/models";

export function RaiseListPage() {
  const navigate = useNavigate();
  const { data: positions, isLoading } = usePositions();
  const createDraft = useCreateDraft();
  const user = useAuthStore((s) => s.user);

  const handleRaiseNew = () => {
    const input = {
      positionType: "NEW_HIRE" as const,
      costCentre: user?.costCentre ?? "",
      jobCode: "",
      division: "",
      jobTitle: "",
      reportingManager: "",
      jd: "",
      requiredSkills: [] as string[],
      salaryRange: { min: 0, max: 0, currency: "INR" },
      requiredStartDate: new Date().toISOString(),
      shiftTime: "",
      shiftDays: [] as string[],
      location: "",
      experienceLevel: "",
      impactIfUnfilled: "",
      sittingPlace: "",
      approvalSkipped: false,
      mrfTemplateId: "",
    };
    createDraft.mutate(input, {
      onSuccess: (pos) => navigate(`/raise/${pos.id}`),
      onError: (e) => alert(`Failed to create draft: ${(e as Error).message}`),
    });
  };

  const drafts = positions?.filter((p) => p.status === "DRAFT") ?? [];
  const submitted = positions?.filter((p) => p.status !== "DRAFT") ?? [];

  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">My Positions</h1>
        <button
          onClick={handleRaiseNew}
          disabled={createDraft.isPending}
          className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {createDraft.isPending ? "Creating…" : "Raise New Position"}
        </button>
      </div>

      {isLoading ? (
        <p className="text-gray-500">Loading…</p>
      ) : positions && positions.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-500">
          You have no positions yet. Raise your first position.
        </p>
      ) : (
        <div className="space-y-6">
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Drafts ({drafts.length})
            </h2>
            <div className="space-y-3">
              {drafts.map((p) => (
                <DraftRow key={p.id} position={p} onEdit={() => navigate(`/raise/${p.id}`)} />
              ))}
              {drafts.length === 0 && <p className="text-sm text-gray-400">No drafts.</p>}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Submitted ({submitted.length})
            </h2>
            <div className="space-y-3">
              {submitted.map((p) => (
                <PositionCard key={p.id} position={p} />
              ))}
              {submitted.length === 0 && <p className="text-sm text-gray-400">No submitted positions.</p>}
            </div>
          </section>
        </div>
      )}
    </Layout>
  );
}

function DraftRow({ position, onEdit }: { position: Position; onEdit: () => void }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <StatusBadge status={position.status} />
        <div>
          <p className="font-medium text-gray-900">{position.jobTitle || "Untitled position"}</p>
          <p className="text-xs text-gray-500">
            {position.jobCode} · updated {new Date(position.updatedAt).toLocaleDateString()}
          </p>
        </div>
      </div>
      <button
        onClick={onEdit}
        className="rounded border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-100"
      >
        Edit
      </button>
    </div>
  );
}
