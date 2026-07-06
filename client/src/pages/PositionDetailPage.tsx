import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "../components/Layout";
import { getPosition, approvePosition, rejectPosition, holdPosition, releaseHoldPosition, postJob } from "../api/positions";
import { StatusBadge } from "../components/StatusBadge";
import { AuditTrail } from "../components/AuditTrail";
import { useAuthStore } from "../store/authStore";

export function PositionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  // Modals / Inputs
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approveNotes, setApproveNotes] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [holdDays, setHoldDays] = useState("30");

  const { data: pos, isLoading } = useQuery({
    queryKey: ["position", id],
    queryFn: () => getPosition(id!),
  });

  const approveMutation = useMutation({
    mutationFn: () => approvePosition(pos!.id, approveNotes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["position", id] });
      setShowApproveModal(false);
      setApproveNotes("");
    },
    onError: (e) => alert(`Approval failed: ${(e as Error).message}`),
  });

  const rejectMutation = useMutation({
    mutationFn: () => rejectPosition(pos!.id, rejectReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["position", id] });
      setShowRejectModal(false);
      setRejectReason("");
    },
    onError: (e) => alert(`Rejection failed: ${(e as Error).message}`),
  });

  const holdMutation = useMutation({
    mutationFn: () => holdPosition(pos!.id, Number(holdDays)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["position", id] });
      setShowHoldModal(false);
    },
    onError: (e) => alert(`Hold failed: ${(e as Error).message}`),
  });

  const releaseMutation = useMutation({
    mutationFn: () => releaseHoldPosition(pos!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["position", id] });
    },
    onError: (e) => alert(`Release failed: ${(e as Error).message}`),
  });

  const postMutation = useMutation({
    mutationFn: () => postJob(pos!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["position", id] });
    },
    onError: (e) => alert(`Job posting failed: ${(e as Error).message}`),
  });

  if (isLoading) {
    return (
      <Layout>
        <p className="text-slate-500 py-8 text-center">Loading requisition details…</p>
      </Layout>
    );
  }

  if (!pos) {
    return (
      <Layout>
        <p className="text-slate-500 py-8 text-center">Requisition not found.</p>
      </Layout>
    );
  }

  const isHm = user?.role === "HM";
  const isTa = user?.role === "HR_TA";
  const isAdmin = user?.role === "Admin";

  const adjustedHoldDate = new Date(
    new Date(pos.requiredStartDate).getTime() + Number(holdDays) * 24 * 60 * 60 * 1000
  ).toLocaleDateString();

  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between border-b pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{pos.jobTitle}</h1>
            <StatusBadge status={pos.status} />
          </div>
          <p className="text-sm text-slate-500 mt-1">Requisition {pos.jobCode} · raised by {pos.raisedBy === user?.id ? "Me" : "Manager"}</p>
        </div>
        <Link to="/positions" className="text-sm text-indigo-600 font-semibold hover:underline">
          &larr; Back to List
        </Link>
      </div>

      {/* Action Bars depending on roles & status */}
      <div className="mb-8 flex flex-wrap gap-3">
        {/* HM Hold Actions */}
        {isHm && (pos.status === "APPROVED" || pos.status === "POSTED") && (
          <button
            onClick={() => setShowHoldModal(true)}
            className="rounded-lg bg-amber-500 hover:bg-amber-600 px-4 py-2 text-xs font-semibold text-white transition-all shadow-md shadow-amber-500/10"
          >
            Place On Hold
          </button>
        )}
        {isHm && pos.status === "ON_HOLD" && (
          <button
            onClick={() => releaseMutation.mutate()}
            disabled={releaseMutation.isPending}
            className="rounded-lg bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-semibold text-white transition-all disabled:opacity-50"
          >
            {releaseMutation.isPending ? "Releasing..." : "Release Hold"}
          </button>
        )}

        {/* TA Posting Actions */}
        {isTa && pos.status === "APPROVED" && (
          <button
            onClick={() => postMutation.mutate()}
            disabled={postMutation.isPending}
            className="rounded-lg bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-xs font-semibold text-white transition-all disabled:opacity-50"
          >
            {postMutation.isPending ? "Posting..." : "Mark as Posted (Start Sourcing)"}
          </button>
        )}

        {/* TA or Admin Approval Actions */}
        {(isTa || isAdmin) && pos.status === "PENDING_APPROVAL" && (
          <>
            <button
              onClick={() => setShowApproveModal(true)}
              className="rounded-lg bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-xs font-semibold text-white transition-all"
            >
              Approve Requisition
            </button>
            <button
              onClick={() => setShowRejectModal(true)}
              className="rounded-lg bg-rose-600 hover:bg-rose-700 px-4 py-2 text-xs font-semibold text-white transition-all"
            >
              Reject Requisition
            </button>
          </>
        )}

        {/* ATS Candidates Direct Link */}
        {(pos.status === "POSTED" || pos.status === "APPROVED" || pos.status === "FILLED") && (
          <Link
            to={`/positions/${pos.id}/candidates`}
            className="rounded-lg border border-slate-300 bg-white hover:bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 transition-all shadow-sm"
          >
            View Candidate Pipeline (ATS)
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* MRF Requisition details */}
        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 border-b pb-3 mb-4">Headcount Details</h2>
            <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
              <div>
                <span className="font-semibold block text-slate-400 text-xs">Cost Centre Code</span>
                <span className="mt-1 block text-slate-800 font-medium">{pos.costCentre}</span>
              </div>
              <div>
                <span className="font-semibold block text-slate-400 text-xs">Division</span>
                <span className="mt-1 block text-slate-800 font-medium">{pos.division}</span>
              </div>
              <div>
                <span className="font-semibold block text-slate-400 text-xs">Reporting Manager</span>
                <span className="mt-1 block text-slate-800 font-medium">{pos.reportingManager || "—"}</span>
              </div>
              <div>
                <span className="font-semibold block text-slate-400 text-xs">Required Start Date</span>
                <span className="mt-1 block text-slate-800 font-medium">
                  {pos.requiredStartDate ? new Date(pos.requiredStartDate).toLocaleDateString() : "—"}
                </span>
              </div>
              <div>
                <span className="font-semibold block text-slate-400 text-xs">Work Location</span>
                <span className="mt-1 block text-slate-800 font-medium">{pos.location}</span>
              </div>
              <div>
                <span className="font-semibold block text-slate-400 text-xs">Experience Level Required</span>
                <span className="mt-1 block text-slate-800 font-medium">{pos.experienceLevel}</span>
              </div>
              <div>
                <span className="font-semibold block text-slate-400 text-xs">Shift Timing</span>
                <span className="mt-1 block text-slate-800 font-medium">{pos.shiftTime}</span>
              </div>
              <div>
                <span className="font-semibold block text-slate-400 text-xs">Sitting Place Allocation</span>
                <span className="mt-1 block text-slate-800 font-medium">{pos.sittingPlace || "—"}</span>
              </div>
              <div className="col-span-2">
                <span className="font-semibold block text-slate-400 text-xs">Shift Days</span>
                <div className="mt-1.5 flex gap-1">
                  {pos.shiftDays.map((d) => (
                    <span key={d} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 font-medium">
                      {d}
                    </span>
                  ))}
                </div>
              </div>
              <div className="col-span-2 border-t pt-4">
                <span className="font-semibold block text-slate-400 text-xs">Job Description (JD)</span>
                <p className="mt-2 text-slate-700 leading-relaxed bg-slate-50/50 rounded-lg p-4 border text-xs whitespace-pre-line">{pos.jd}</p>
              </div>
              <div className="col-span-2 border-t pt-4">
                <span className="font-semibold block text-slate-400 text-xs">Required Technical Skills</span>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {pos.requiredSkills.map((sk) => (
                    <span key={sk} className="rounded-md bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-1 text-xs font-semibold">
                      {sk}
                    </span>
                  ))}
                </div>
              </div>
              <div className="col-span-2 border-t pt-4">
                <span className="font-semibold block text-slate-400 text-xs">Business Impact If Unfilled</span>
                <p className="mt-2 text-slate-700 leading-relaxed text-xs">{pos.impactIfUnfilled}</p>
              </div>
            </div>
          </section>

          {/* Replacement ex-employee details block */}
          {pos.positionType === "REPLACEMENT" && pos.replacementDetails && (
            <section className="rounded-xl border border-rose-200 bg-rose-50/10 p-6 shadow-sm">
              <h2 className="text-base font-bold text-rose-900 border-b border-rose-100 pb-3 mb-4">
                Replacement Personnel Details
              </h2>
              <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                <div>
                  <span className="font-semibold block text-rose-800 text-xs">Ex-Employee Name</span>
                  <span className="mt-1 block text-slate-800 font-medium">{(pos.replacementDetails as any).exEmployeeName}</span>
                </div>
                <div>
                  <span className="font-semibold block text-rose-800 text-xs">Ex-Employee ID</span>
                  <span className="mt-1 block text-slate-800 font-medium">{(pos.replacementDetails as any).exEmployeeId}</span>
                </div>
                <div>
                  <span className="font-semibold block text-rose-800 text-xs">BU / Department</span>
                  <span className="mt-1 block text-slate-800 font-medium">
                    {(pos.replacementDetails as any).bu} / {(pos.replacementDetails as any).department}
                  </span>
                </div>
                <div>
                  <span className="font-semibold block text-rose-800 text-xs">Resigned Salary</span>
                  <span className="mt-1 block text-slate-800 font-medium">₹{(pos.replacementDetails as any).lastSalary.toLocaleString()}</span>
                </div>
                <div className="col-span-2 border-t border-rose-100 pt-4">
                  <span className="font-semibold block text-rose-800 text-xs">Reason for Leaving / Departure</span>
                  <p className="mt-1.5 text-slate-700 text-xs font-medium bg-white border border-rose-100 rounded-lg p-3">
                    {(pos.replacementDetails as any).reasonForLeaving || "—"}
                  </p>
                </div>
                <div>
                  <span className="font-semibold block text-rose-800 text-xs">System Risk Severity Code</span>
                  <span className="mt-1 inline-flex items-center gap-1.5 font-bold text-xs mt-2 px-2.5 py-1 rounded bg-white border border-rose-100">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        (pos.replacementDetails as any).colourCode === "GREEN"
                          ? "bg-emerald-500"
                          : (pos.replacementDetails as any).colourCode === "RED"
                          ? "bg-rose-500"
                          : "bg-slate-900"
                      }`}
                    ></span>
                    {(pos.replacementDetails as any).colourCode}
                  </span>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Audit trail list panel */}
        <div>
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm h-full">
            <h2 className="text-base font-bold text-slate-900 border-b pb-3 mb-4">Audit Action History</h2>
            <AuditTrail entries={pos.auditLog} />
          </section>
        </div>
      </div>

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-6 border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Approve headcount request</h3>
            <p className="text-xs text-slate-400 mb-4">Provide any notes or remarks regarding the approval for auditing purposes.</p>
            <textarea
              value={approveNotes}
              onChange={(e) => setApproveNotes(e.target.value)}
              placeholder="e.g. Approved. Budget verified."
              rows={3}
              className="w-full rounded border p-2 text-sm mb-4"
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowApproveModal(false)} className="rounded border px-4 py-2 text-xs font-semibold">Cancel</button>
              <button
                onClick={() => approveMutation.mutate()}
                disabled={approveMutation.isPending}
                className="rounded bg-indigo-600 text-white px-4 py-2 text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50"
              >
                {approveMutation.isPending ? "Approving..." : "Approve Requisition"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-6 border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Reject Requisition</h3>
            <p className="text-xs text-slate-400 mb-4 font-semibold text-rose-500">Provide a mandatory reason for rejecting this headcount request.</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Budget constraints. Re-submit next quarter."
              rows={3}
              className="w-full rounded border p-2 text-sm mb-4"
              required
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowRejectModal(false)} className="rounded border px-4 py-2 text-xs font-semibold">Cancel</button>
              <button
                onClick={() => rejectMutation.mutate()}
                disabled={rejectMutation.isPending || !rejectReason.trim()}
                className="rounded bg-rose-600 text-white px-4 py-2 text-xs font-semibold hover:bg-rose-700 disabled:opacity-50"
              >
                {rejectMutation.isPending ? "Rejecting..." : "Reject Requisition"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hold Modal */}
      {showHoldModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-6 border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Place Position on Hold</h3>
            <p className="text-xs text-slate-400 mb-4">Requisitions can be placed on hold for a maximum of 30 days. The required start date will automatically shift forward.</p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Hold Duration (Days)</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={holdDays}
                  onChange={(e) => setHoldDays(e.target.value)}
                  className="w-full rounded border p-2 text-sm"
                />
              </div>
              <div className="bg-slate-50 p-3 rounded border text-xs leading-normal">
                <p><span className="font-semibold text-slate-500">Current Start Date:</span> {new Date(pos.requiredStartDate).toLocaleDateString()}</p>
                <p className="mt-1"><span className="font-semibold text-indigo-600">Adjusted Start Date:</span> {adjustedHoldDate}</p>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setShowHoldModal(false)} className="rounded border px-4 py-2 text-xs font-semibold">Cancel</button>
              <button
                onClick={() => holdMutation.mutate()}
                disabled={holdMutation.isPending || Number(holdDays) < 1 || Number(holdDays) > 30}
                className="rounded bg-amber-500 text-white px-4 py-2 text-xs font-semibold hover:bg-amber-600 disabled:opacity-50"
              >
                {holdMutation.isPending ? "Processing..." : "Confirm Hold"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
