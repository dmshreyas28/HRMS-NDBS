import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "../components/Layout";
import { StatusBadge } from "../components/StatusBadge";
import { PositionCard } from "../components/PositionCard";
import { usePositions, useCreateDraft } from "../hooks/usePositions";
import { useAuthStore } from "../store/authStore";
import { listResignations } from "../api/resignations";
import type { Position } from "../types/models";

export function RaiseListPage() {
  const navigate = useNavigate();
  const { data: positions, isLoading } = usePositions();
  const createDraft = useCreateDraft();
  const user = useAuthStore((s) => s.user);

  const [showTypeModal, setShowTypeModal] = useState(false);
  const [positionType, setPositionType] = useState<"NEW_HIRE" | "REPLACEMENT">("NEW_HIRE");
  const [selectedResignationId, setSelectedResignationId] = useState("");

  const { data: resignations } = useQuery({
    queryKey: ["resignations"],
    queryFn: listResignations,
    enabled: showTypeModal,
  });

  const approvedResignations = resignations?.filter((r) => r.status === "REPLACED") ?? [];

  const handleRaiseSubmit = () => {
    if (positionType === "REPLACEMENT" && !selectedResignationId) {
      alert("Please select an approved resignation to proceed.");
      return;
    }

    let replacementDetails = undefined;
    let costCentre = user?.costCentre ?? "";
    let division = user?.department ?? "";
    let jobTitle = "";

    if (positionType === "REPLACEMENT") {
      const res = approvedResignations.find((r) => r.id === selectedResignationId);
      if (res) {
        costCentre = res.bu || costCentre;
        division = res.department || division;
        jobTitle = `Replacement for ${res.employeeName}`;
        replacementDetails = {
          exEmployeeId: res.employeeId,
          exEmployeeName: res.employeeName,
          exEmployeeEmail: res.employeeEmail,
          exEmployeePhone: res.employeePhone,
          bu: res.bu,
          department: res.department,
          lastSalary: res.lastSalary,
          reasonForLeaving: res.reasonForLeaving || "Resigned",
          colourCode: res.colourCode || "GREEN",
        };
      }
    }

    const input = {
      positionType,
      costCentre,
      jobCode: "",
      division,
      jobTitle,
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
      replacementDetails,
    };

    createDraft.mutate(input, {
      onSuccess: (pos) => {
        setShowTypeModal(false);
        navigate(`/raise/${pos.id}`);
      },
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
          onClick={() => {
            setPositionType("NEW_HIRE");
            setSelectedResignationId("");
            setShowTypeModal(true);
          }}
          disabled={createDraft.isPending}
          className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          Raise New Position
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
      {/* Requisition Type Selection Modal */}
      {showTypeModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-6 border border-slate-100 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Raise Requisition</h3>
            <p className="text-xs text-slate-400">Choose the type of headcount requisition you wish to create.</p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPositionType("NEW_HIRE")}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all ${
                  positionType === "NEW_HIRE"
                    ? "border-indigo-600 bg-indigo-50/30 text-indigo-700 font-bold"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <svg className="h-6 w-6 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-xs font-semibold">New Hire</span>
              </button>

              <button
                type="button"
                onClick={() => setPositionType("REPLACEMENT")}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all ${
                  positionType === "REPLACEMENT"
                    ? "border-indigo-600 bg-indigo-50/30 text-indigo-700 font-bold"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <svg className="h-6 w-6 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H17" />
                </svg>
                <span className="text-xs font-semibold">Replacement</span>
              </button>
            </div>

            {positionType === "REPLACEMENT" && (
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-bold text-slate-500">Select Approved Resignation</label>
                {approvedResignations.length > 0 ? (
                  <select
                    value={selectedResignationId}
                    onChange={(e) => setSelectedResignationId(e.target.value)}
                    className="w-full rounded border p-2 text-sm text-slate-700 bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">Choose resignation...</option>
                    {approvedResignations.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.employeeName} ({r.employeeId}) · {r.department}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-xs text-rose-500 font-medium py-1">
                    No approved resignations available for replacement. You must decide 'Hire' on a resignation first.
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowTypeModal(false)}
                className="rounded border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRaiseSubmit}
                disabled={
                  createDraft.isPending ||
                  (positionType === "REPLACEMENT" && approvedResignations.length === 0)
                }
                className="rounded bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {createDraft.isPending ? "Creating..." : "Create Requisition Draft"}
              </button>
            </div>
          </div>
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
