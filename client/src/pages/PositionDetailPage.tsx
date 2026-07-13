import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "../components/Layout";
import {
  getPosition,
  approvePosition,
  rejectPosition,
  holdPosition,
  releaseHoldPosition,
  postJob,
  saveReviewerEmailDraft,
  sendReviewerEmail,
} from "../api/positions";
import { listCandidates } from "../api/candidates";
import { StatusBadge } from "../components/StatusBadge";
import { AuditTrail } from "../components/AuditTrail";
import { useAuthStore } from "../store/authStore";
import { PageHeader, Card, Spinner, Button, Modal, Textarea } from "../components/ui";
import { formatDate } from "../utils/constants";

// Stable timestamp for hold-expiry calculation — computed once at module load,
// not inline during render, to satisfy the no-impure-calls-during-render rule.
const PAGE_LOAD_NOW = Date.now();

export function PositionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  // Modals / Inputs
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [holdOpen, setHoldOpen] = useState(false);
  const [holdDays, setHoldDays] = useState("30");

  const { data: pos, isLoading } = useQuery({
    queryKey: ["position", id],
    queryFn: () => getPosition(id!),
  });

  const { data: candidates } = useQuery({
    queryKey: ["candidates", id],
    queryFn: () => listCandidates(id!),
    enabled: !!id,
  });

  const approveMutation = useMutation({
    mutationFn: (notes: string) => approvePosition(pos!.id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["position", id] });
      alert("Requisition approved successfully.");
    },
    onError: (e) => alert(`Approval failed: ${(e as Error).message}`),
  });

  const rejectMutation = useMutation({
    mutationFn: () => rejectPosition(pos!.id, rejectReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["position", id] });
      setRejectOpen(false);
      setRejectReason("");
      alert("Requisition rejected successfully.");
    },
    onError: (e) => alert(`Rejection failed: ${(e as Error).message}`),
  });

  const holdMutation = useMutation({
    mutationFn: () => holdPosition(pos!.id, Number(holdDays)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["position", id] });
      setHoldOpen(false);
      alert("Requisition placed on hold.");
    },
    onError: (e) => alert(`Hold failed: ${(e as Error).message}`),
  });

  const releaseMutation = useMutation({
    mutationFn: () => releaseHoldPosition(pos!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["position", id] });
      alert("Requisition released from hold.");
    },
    onError: (e) => alert(`Release failed: ${(e as Error).message}`),
  });

  const postMutation = useMutation({
    mutationFn: () => postJob(pos!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["position", id] });
      alert("Requisition marked as posted (Start sourcing).");
    },
    onError: (e) => alert(`Job posting failed: ${(e as Error).message}`),
  });

  // Initialise email draft text from the fetched position; use a ref to avoid
  // cascading renders from calling setState inside an effect.
  const emailDraftInitialised = useRef(false);
  const [emailDraftText, setEmailDraftText] = useState("");
  useEffect(() => {
    if (pos?.reviewerEmailDraft && !emailDraftInitialised.current) {
      emailDraftInitialised.current = true;
      setEmailDraftText(pos.reviewerEmailDraft);
    }
  }, [pos?.reviewerEmailDraft]);

  const saveDraftMutation = useMutation({
    mutationFn: (draftText: string) => saveReviewerEmailDraft(pos!.id, draftText),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["position", id] });
      alert("Email draft saved successfully.");
    },
    onError: (e) => alert(`Failed to save draft: ${(e as Error).message}`),
  });

  const sendEmailMutation = useMutation({
    mutationFn: () => sendReviewerEmail(pos!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["position", id] });
      alert("Email sent to reviewer.");
    },
    onError: (e) => alert(`Failed to send email: ${(e as Error).message}`),
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center py-12"><Spinner /></div>
      </Layout>
    );
  }

  if (!pos) {
    return (
      <Layout>
        <div className="p-8 text-center text-slate-500">Requisition not found.</div>
      </Layout>
    );
  }

  const role = user?.role ?? "HM";
  const isOwner = pos.raisedBy === user?.id;
  const canApproveReject = role === "Admin" || role === "HR_TA" || (role === "HM" && pos.reviewerId === user?.id);
  const canHold = role === "Admin" || (role === "HM" && isOwner);
  const isTA = role === "HR_TA" || role === "Admin";

  const holdExpiry = pos.onHold?.expiresAt ? new Date(pos.onHold.expiresAt) : null;
  const daysToExpiry = holdExpiry ? Math.max(0, Math.floor((holdExpiry.getTime() - PAGE_LOAD_NOW) / 86400000)) : 0;

  return (
    <Layout>
      <PageHeader
        title={pos.jobTitle || 'Untitled Position'}
        subtitle={`${pos.positionType === 'NEW_HIRE' ? 'New Hire' : 'Replacement'} · ${pos.costCentre} · raised by ${pos.raisedByName ?? '—'}`}
        actions={<Link to="/positions"><Button variant="secondary">← Back</Button></Link>}
      />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status bar card */}
          <Card className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <StatusBadge status={pos.status} />
                {pos.approvalSkipped && <span className="text-xs px-2 py-0.5 bg-slate-100 rounded text-slate-500 font-semibold">approval skipped</span>}
                {pos.onHold?.isOnHold && (
                  <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-800 rounded font-semibold">
                    on hold · {daysToExpiry}d left
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {/* Hold / Release Actions */}
                {canHold && !pos.onHold?.isOnHold && !['FILLED', 'COLLAPSED', 'REJECTED'].includes(pos.status) && (
                  <Button variant="secondary" onClick={() => setHoldOpen(true)}>
                    Place On Hold
                  </Button>
                )}
                {canHold && pos.onHold?.isOnHold && (
                  <Button variant="secondary" onClick={() => releaseMutation.mutate()} disabled={releaseMutation.isPending}>
                    {releaseMutation.isPending ? "Releasing..." : "Release Hold"}
                  </Button>
                )}

                {/* Approver actions */}
                {canApproveReject && pos.status === 'PENDING_APPROVAL' && (
                  <>
                    <Button variant="primary" onClick={() => approveMutation.mutate("")} disabled={approveMutation.isPending}>
                      Approve Requisition
                    </Button>
                    <Button variant="danger" onClick={() => setRejectOpen(true)}>
                      Reject Requisition
                    </Button>
                  </>
                )}

                {/* TA actions */}
                {isTA && pos.status === 'APPROVED' && (
                  <Button variant="primary" onClick={() => postMutation.mutate()} disabled={postMutation.isPending}>
                    {postMutation.isPending ? "Posting..." : "📣 Mark as Posted"}
                  </Button>
                )}

                {/* Candidates / ATS link */}
                {(pos.status === 'POSTED' || pos.status === 'FILLED' || pos.status === 'APPROVED') && (
                  <Link to={`/positions/${pos.id}/candidates`}>
                    <Button variant="secondary">👥 ATS Candidates ({candidates?.length ?? 0})</Button>
                  </Link>
                )}
              </div>
            </div>
          </Card>

          {/* Requisition Details */}
          <Card className="p-5">
            <h3 className="font-semibold text-slate-900 mb-3">Job Details</h3>
            <dl className="grid md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <Detail label="Job code" value={pos.jobCode} />
              <Detail label="Division" value={pos.division} />
              <Detail label="Reporting manager" value={pos.reportingManager} />
              <Detail label="Location" value={pos.location} />
              <Detail label="Experience level" value={pos.experienceLevel} />
              <Detail label="Required start date" value={formatDate(pos.requiredStartDate)} />
              <Detail label="Shift" value={`${pos.shiftTime ?? '—'} · ${(pos.shiftDays ?? []).join(', ')}`} />
              <Detail label="Salary range" value={`${pos.salaryRange?.currency ?? ''} ${pos.salaryRange?.min?.toLocaleString() ?? 0} – ${pos.salaryRange?.max?.toLocaleString() ?? 0}`} />
            </dl>
            <div className="mt-4 border-t pt-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Job description</p>
              <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap leading-relaxed">{pos.jd || '—'}</p>
            </div>
            {pos.requiredSkills?.length > 0 && (
              <div className="mt-4 border-t pt-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Required skills</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {pos.requiredSkills.map((s: string) => (
                    <span key={s} className="text-xs font-bold px-2 py-1 bg-brand-50 border border-brand-100 text-brand-700 rounded">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {pos.impactIfUnfilled && (
              <div className="mt-4 border-t pt-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Business Impact If Unfilled</p>
                <p className="text-sm text-slate-700 mt-1">{pos.impactIfUnfilled}</p>
              </div>
            )}
          </Card>

          {/* Replacement Info */}
          {pos.positionType === 'REPLACEMENT' && pos.replacementDetails && (
            <Card className="p-5 border-rose-100 bg-rose-50/10">
              <h3 className="font-semibold text-slate-900 mb-3 text-rose-950">Ex-employee replacement details</h3>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-medium text-slate-500">Departure risk profile:</span>
                <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                    pos.replacementDetails.colourCode === 'RED' ? 'bg-rose-100 text-rose-800' :
                    pos.replacementDetails.colourCode === 'BLACK' ? 'bg-slate-900 text-white' :
                    'bg-emerald-100 text-emerald-800'
                  }`}>
                    {pos.replacementDetails.colourCode}
                  </span>
              </div>
              <dl className="grid md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <Detail label="Name" value={pos.replacementDetails.exEmployeeName} />
                <Detail label="Employee ID" value={pos.replacementDetails.exEmployeeId} />
                <Detail label="Email" value={pos.replacementDetails.exEmployeeEmail} />
                <Detail label="Phone" value={pos.replacementDetails.exEmployeePhone} />
                <Detail label="BU" value={pos.replacementDetails.bu} />
                <Detail label="Department" value={pos.replacementDetails.department} />
                <Detail label="Last salary" value={pos.replacementDetails.lastSalary?.toLocaleString()} />
                <Detail label="Reason for leaving" value={pos.replacementDetails.reasonForLeaving} />
              </dl>
            </Card>
          )}

          {/* Reviewer email draft */}
          {isTA && pos.status === 'PENDING_APPROVAL' && (
            <Card className="p-5">
              <h3 className="font-semibold text-slate-900 mb-3">✉️ Reviewer email draft</h3>
              <p className="text-xs text-slate-400 mb-2">Auto-generated email. Click outside to focus before saving/sending.</p>
              <Textarea
                rows={8}
                value={emailDraftText}
                onChange={(e) => setEmailDraftText(e.target.value)}
              />
              <div className="flex justify-end gap-2 mt-3">
                <Button variant="secondary" onClick={() => saveDraftMutation.mutate(emailDraftText)} disabled={saveDraftMutation.isPending}>
                  Save Draft
                </Button>
                <Button variant="primary" onClick={() => sendEmailMutation.mutate()} disabled={sendEmailMutation.isPending}>
                  Send to reviewer
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Audit timeline */}
        <div>
          <Card className="p-5 sticky top-20">
            <h3 className="font-semibold text-slate-900 mb-4">Audit timeline</h3>
            <AuditTrail entries={pos.auditLog ?? []} />
          </Card>
        </div>
      </div>

      {/* Reject Modal */}
      <Modal open={rejectOpen} onClose={() => setRejectOpen(false)} title="Reject Requisition">
        <Textarea
          label="Rejection reason (sent to Hiring Manager)"
          rows={3}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
        />
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="secondary" onClick={() => setRejectOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => rejectMutation.mutate()} disabled={rejectMutation.isPending || !rejectReason.trim()}>
            {rejectMutation.isPending ? "Rejecting..." : "Reject MRF"}
          </Button>
        </div>
      </Modal>

      {/* Hold Modal */}
      <Modal open={holdOpen} onClose={() => setHoldOpen(false)} title="Place Position On Hold">
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Requisitions can be placed on hold for a maximum of 30 days. The required start date will automatically shift forward.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Hold Duration (Days)</label>
            <input
              type="number"
              min="1"
              max="30"
              value={holdDays}
              onChange={(e) => setHoldDays(e.target.value)}
              className="w-full rounded border border-slate-300 p-2 text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button variant="secondary" onClick={() => setHoldOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => holdMutation.mutate()} disabled={holdMutation.isPending}>
              Confirm Hold
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}

function Detail({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</dt>
      <dd className="text-sm text-slate-800 mt-0.5 font-medium">{value || '—'}</dd>
    </div>
  );
}
