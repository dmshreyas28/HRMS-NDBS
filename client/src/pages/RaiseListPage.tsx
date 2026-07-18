import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "../components/Layout";
import { StatusBadge } from "../components/StatusBadge";
import { PositionCard } from "../components/PositionCard";
import { usePositions, useCreateDraft } from "../hooks/usePositions";
import { useAuthStore } from "../store/authStore";
import { listResignations, decideResignation } from "../api/resignations";
import { PageHeader, Card, Spinner, EmptyState, Button, Modal } from '../components/ui';
import type { Position } from "../types/models";

export function RaiseListPage() {
  const navigate = useNavigate();
  const { data: positions, isLoading } = usePositions();
  const createDraft = useCreateDraft();
  const user = useAuthStore((s) => s.user);

  const [showTypeModal, setShowTypeModal] = useState(false);
  const [positionType, setPositionType] = useState<"NEW_HIRE" | "REPLACEMENT">("NEW_HIRE");
  const [selectedResignationId, setSelectedResignationId] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [noHireReason, setNoHireReason] = useState("");
  const [noHireColour, setNoHireColour] = useState("GREEN");
  const [noHireTarget, setNoHireTarget] = useState<{ id: string; name: string } | null>(null);

  const { data: resignations, refetch: refetchResignations } = useQuery({
    queryKey: ["resignations"],
    queryFn: () => listResignations("APPROVED"),
    enabled: showTypeModal,
  });

  const approvedResignations = resignations ?? [];
  const selectedResignation = approvedResignations.find((r) => r.id === selectedResignationId);

  const decideNoHire = async () => {
    if (!noHireTarget) return;
    try {
      await decideResignation(noHireTarget.id, "NO_HIRE", noHireReason, noHireColour);
      alert(`Replacement recorded as NO HIRE for ${noHireTarget.name}.`);
      setNoHireTarget(null);
      setNoHireReason("");
      refetchResignations();
    } catch (e) {
      alert(`Failed: ${(e as Error).message}`);
    }
  };

  const handleRaiseSubmit = (overrideResignationId?: string) => {
    const effectiveId = overrideResignationId ?? selectedResignationId;
    const effectiveResignation = overrideResignationId
      ? approvedResignations.find((r) => r.id === overrideResignationId)
      : selectedResignation;

    if (positionType === "REPLACEMENT" && !effectiveId) {
      alert("Please select an approved resignation to proceed.");
      return;
    }

    let replacementDetails = undefined;
    let costCentre = user?.costCentre ?? "";
    let division = user?.department ?? "";
    let jobTitle = "";
    let resignationId: string | undefined = undefined;

    if (positionType === "REPLACEMENT" && effectiveResignation) {
      costCentre = effectiveResignation.costCentreId || effectiveResignation.bu || costCentre;
      division = effectiveResignation.department || division;
      jobTitle = effectiveResignation.jobTitle || `Replacement for ${effectiveResignation.employeeName}`;
      resignationId = effectiveResignation.id;
      replacementDetails = {
        exEmployeeId: effectiveResignation.employeeId,
        exEmployeeName: effectiveResignation.employeeName,
        exEmployeeEmail: effectiveResignation.employeeEmail,
        exEmployeePhone: effectiveResignation.employeePhone,
        bu: effectiveResignation.bu,
        department: effectiveResignation.department,
        lastSalary: effectiveResignation.lastSalary,
        reasonForLeaving: effectiveResignation.reasonForLeaving || "Resigned",
        colourCode: effectiveResignation.colourCode || "GREEN",
      };
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
      salaryRange: { min: 0, max: effectiveResignation?.lastSalary || 0, currency: "INR" },
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
      resignationId,
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
      <PageHeader
        title="My Positions"
        subtitle="Manage your headcount requisitions and draft submissions"
        actions={
          <Button
            variant="primary"
            onClick={() => {
              setPositionType("NEW_HIRE");
              setSelectedResignationId("");
              setShowTypeModal(true);
            }}
            disabled={createDraft.isPending}
          >
            Raise Requisition
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : positions && positions.length === 0 ? (
        <EmptyState title="You have no positions yet" hint="Raise your first headcount requisition draft." />
      ) : (
        <div className="space-y-6">
          <section>
            <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
              Drafts ({drafts.length})
            </h2>
            <div className="space-y-3">
              {drafts.map((p) => (
                <DraftRow key={p.id} position={p} onEdit={() => navigate(`/raise/${p.id}`)} onDelete={() => {}} />
              ))}
              {drafts.length === 0 && <p className="text-sm text-slate-400">No drafts.</p>}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
              Submitted ({submitted.length})
            </h2>
            <div className="space-y-3">
              {submitted.map((p) => (
                <PositionCard key={p.id} position={p} />
              ))}
              {submitted.length === 0 && <p className="text-sm text-slate-400">No submitted positions.</p>}
            </div>
          </section>
        </div>
      )}

      {/* Requisition Type Selection Modal */}
      <Modal open={showTypeModal} onClose={() => setShowTypeModal(false)} title="Raise Requisition">
        <div className="space-y-4">
          <p className="text-xs text-slate-400">Choose the type of headcount requisition you wish to create.</p>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={() => setPositionType("NEW_HIRE")}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all ${
                positionType === "NEW_HIRE"
                  ? "border-brand-600 bg-brand-50/30 text-brand-700 font-bold"
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
                  ? "border-brand-600 bg-brand-50/30 text-brand-700 font-bold"
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
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Approved Resignations</label>
              {approvedResignations.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {approvedResignations.map((r) => (
                    <div
                      key={r.id}
                      className={`rounded-lg border p-3 cursor-pointer transition-all ${
                        selectedResignationId === r.id
                          ? "border-brand-600 bg-brand-50/20"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                      onClick={() => setSelectedResignationId(r.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-bold text-slate-800">{r.employeeName}</p>
                          <p className="text-xs text-slate-500">{r.jobTitle} · {r.department}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {r.bu} · Last Salary: ₹{r.lastSalary.toLocaleString()}
                          </p>
                        </div>
                        <div className="flex gap-1.5 shrink-0 ml-3">
                          <Button
                            variant="primary"
                            className="py-0.5 px-2 text-[10px]"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedResignationId(r.id);
                              handleRaiseSubmit(r.id);
                            }}
                          >
                            Hire
                          </Button>
                          <Button
                            variant="ghost"
                            className="py-0.5 px-2 text-[10px] text-rose-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              setNoHireTarget({ id: r.id, name: r.employeeName });
                            }}
                          >
                            No Hire
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 font-medium py-1">
                  No approved resignations require a replacement decision yet.
                </p>
              )}
            </div>
          )}

          {positionType === "NEW_HIRE" && (
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button variant="secondary" onClick={() => setShowTypeModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleRaiseSubmit} disabled={createDraft.isPending}>
                {createDraft.isPending ? "Creating..." : "Create Requisition Draft"}
              </Button>
            </div>
          )}
        </div>
      </Modal>

      {/* No Hire Modal */}
      <Modal
        open={!!noHireTarget}
        onClose={() => setNoHireTarget(null)}
        title={`No Hire — ${noHireTarget?.name}`}
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Colour Code</label>
            <select
              value={noHireColour}
              onChange={(e) => setNoHireColour(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm bg-white"
            >
              <option value="GREEN">GREEN — Voluntary</option>
              <option value="RED">RED — Performance</option>
              <option value="BLACK">BLACK — Misconduct</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Reason for Leaving</label>
            <textarea
              value={noHireReason}
              onChange={(e) => setNoHireReason(e.target.value)}
              placeholder="Provide context..."
              rows={2}
              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm"
            />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t">
            <Button variant="secondary" onClick={() => setNoHireTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={decideNoHire}>Confirm No Hire</Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}

function DraftRow({ position, onEdit, onDelete }: { position: Position; onEdit: () => void; onDelete: () => void }) {
  return (
    <Card className="flex items-center justify-between p-4 bg-white border border-slate-200">
      <div className="flex items-center gap-3">
        <StatusBadge status={position.status} />
        <div>
          <p className="font-semibold text-slate-800 text-sm">{position.jobTitle || "Untitled position"}</p>
          <p className="text-xs text-slate-500">
            {position.jobCode} · updated {new Date(position.updatedAt).toLocaleDateString()}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="secondary" onClick={onEdit} className="py-1 px-3 text-xs">
          Edit
        </Button>
        <Button
          variant="secondary"
          onClick={onDelete}
          className="py-1 px-3 text-xs text-rose-650 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 bg-white"
        >
          Delete
        </Button>
      </div>
    </Card>
  );
}
