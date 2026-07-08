import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth0 } from "@auth0/auth0-react";
import { Layout } from "../components/Layout";
import { useAuthStore } from "../store/authStore";
import { getHmDashboard, getTaDashboard, getAdminDashboard } from "../api/dashboard";
import { listResignations, decideResignation, simulateResignation } from "../api/resignations";
import { createPosition } from "../api/positions";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api/client";

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { user: auth0User } = useAuth0();
  
  const rolesClaim = auth0User?.["https://hrms.app/roles"];
  const rawRole = user?.role || (Array.isArray(rolesClaim) ? rolesClaim[0] : rolesClaim);

  const role = rawRole ? (
    rawRole.toLowerCase() === "hm" ? "HM" :
    (rawRole.toLowerCase() === "hr_ta" || rawRole.toLowerCase() === "hr/ta") ? "HR_TA" :
    rawRole.toLowerCase() === "admin" ? "Admin" : undefined
  ) : undefined;

  if (role === "HM") return <HmDashboard />;
  if (role === "HR_TA") return <TaDashboard />;
  if (role === "Admin") return <AdminDashboard />;

  return (
    <Layout>
      <div className="p-8 text-center text-slate-500">Initializing your role dashboard…</div>
    </Layout>
  );
}

// ----------------- HIRING MANAGER DASHBOARD -----------------
function HmDashboard() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showSimulateModal, setShowSimulateModal] = useState(false);
  const [showDecisionModal, setShowDecisionModal] = useState<{ id: string; name: string; action: "HIRE" | "NO_HIRE" } | null>(null);

  // Decision Form State
  const [decisionReason, setDecisionReason] = useState("");
  const [decisionColour, setDecisionColour] = useState("GREEN");

  // Simulation Form State
  const [simName, setSimName] = useState("John Doe");
  const [simEmail, setSimEmail] = useState("john.doe@example.com");
  const [simPhone, setSimPhone] = useState("+91 9876543210");
  const [simBu, setSimBu] = useState("CC-001");
  const [simDept, setSimDept] = useState("Engineering");
  const [simSalary, setSimSalary] = useState("1200000");

  const { data: dashboard, isLoading: dashLoading, isError: dashError, error: dashErr, refetch: refetchDash } = useQuery({
    queryKey: ["hm-dashboard"],
    queryFn: getHmDashboard,
  });

  const { data: resignations, isLoading: resignLoading, isError: resignError, error: resignErr, refetch: refetchResign } = useQuery({
    queryKey: ["resignations"],
    queryFn: listResignations,
  });

  const simMutation = useMutation({
    mutationFn: simulateResignation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hm-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["resignations"] });
      setShowSimulateModal(false);
    },
    onError: (e) => alert(`Simulation failed: ${(e as Error).message}`),
  });

  const decideMutation = useMutation({
    mutationFn: async ({ id, decision, reason, colour }: { id: string; decision: "HIRE" | "NO_HIRE"; reason: string; colour: string }) => {
      const res = await decideResignation(id, decision, reason, colour);
      if (decision === "HIRE") {
        const draftInput = {
          positionType: "REPLACEMENT" as const,
          costCentre: res.bu || "CC-001",
          jobCode: "",
          division: res.department || "Technology",
          jobTitle: `Replacement for ${res.employeeName}`,
          reportingManager: "",
          jd: `Replacement vacancy raised for ${res.employeeName} following approved resignation.`,
          requiredSkills: [] as string[],
          salaryRange: { min: 0, max: Number(res.lastSalary), currency: "INR" },
          requiredStartDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          shiftTime: "09:00 - 18:00",
          shiftDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
          location: "On-site",
          experienceLevel: "Mid",
          impactIfUnfilled: "Immediate business impact on department deliverables.",
          sittingPlace: "TBD",
          approvalSkipped: false,
          mrfTemplateId: "",
          replacementDetails: {
            exEmployeeId: res.employeeId,
            exEmployeeName: res.employeeName,
            exEmployeeEmail: res.employeeEmail,
            exEmployeePhone: res.employeePhone,
            bu: res.bu,
            department: res.department,
            lastSalary: res.lastSalary,
            reasonForLeaving: reason,
            colourCode: colour as any,
          }
        };
        const pos = await createPosition(draftInput);
        return { res, draftId: pos.id };
      }
      return { res, draftId: null };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["hm-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["resignations"] });
      setShowDecisionModal(null);
      setDecisionReason("");
      if (variables.decision === "HIRE" && data.draftId) {
        navigate(`/raise/${data.draftId}`);
      }
    },
    onError: (e) => alert(`Decision failed: ${(e as Error).message}`),
  });

  const handleSimulateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dbUser = useAuthStore.getState().user;
    simMutation.mutate({
      employeeId: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
      employeeName: simName,
      employeeEmail: simEmail,
      employeePhone: simPhone,
      bu: simBu,
      department: simDept,
      lastSalary: Number(simSalary),
      managerId: dbUser?.id || "",
    });
  };

  const handleDecisionSubmit = () => {
    if (!showDecisionModal) return;
    decideMutation.mutate({
      id: showDecisionModal.id,
      decision: showDecisionModal.action,
      reason: decisionReason,
      colour: decisionColour,
    });
  };

  const pendingResignationsList = resignations?.filter((r) => r.status === "PENDING_ACTION") ?? [];

  if (dashError || resignError) {
    const errMsg = (dashErr as Error)?.message || (resignErr as Error)?.message || "Unknown error";
    return (
      <Layout>
        <div className="max-w-md mx-auto py-16 text-center space-y-4">
          <p className="text-rose-600 font-semibold">Failed to load dashboard</p>
          <p className="text-sm text-slate-500">{errMsg}</p>
          <div className="flex justify-center gap-3">
            <button onClick={() => { refetchDash(); refetchResign(); }} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Retry</button>
            <button onClick={() => window.location.reload()} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Refresh Page</button>
          </div>
        </div>
      </Layout>
    );
  }

  if (dashLoading || resignLoading) {
    return (
      <Layout>
        <p className="text-slate-500">Loading your Hiring Manager Dashboard…</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Hiring Manager Dashboard</h1>
          <p className="text-slate-500 mt-1">Review team requirements, raise headcounts, and process replacement decisions.</p>
        </div>
        <button
          onClick={() => setShowSimulateModal(true)}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-600/10 hover:bg-emerald-700 transition-all"
        >
          Simulate Resignation Approval
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Active Positions</div>
          <div className="text-3xl font-bold text-indigo-600 mt-2">{dashboard?.activePositions ?? 0}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Pending Approval</div>
          <div className="text-3xl font-bold text-amber-500 mt-2">{dashboard?.pendingApprovals ?? 0}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Drafts</div>
          <div className="text-3xl font-bold text-slate-600 mt-2">{dashboard?.drafts ?? 0}</div>
        </div>
        <div className="rounded-xl border border-rose-100 bg-rose-50/30 p-5 shadow-sm">
          <div className="text-rose-600 text-xs font-semibold uppercase tracking-wider">Inactivity Warnings</div>
          <div className="text-3xl font-bold text-rose-700 mt-2">{dashboard?.inactivityWarnings ?? 0}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Resignations Queue (replacement workflow) */}
        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 border-b pb-3 mb-4">
              Approved Resignations Queue ({pendingResignationsList.length})
            </h2>
            {pendingResignationsList.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">No pending resignations require replacement decisions.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingResignationsList.map((res) => (
                  <div key={res.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-800">{res.employeeName}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {res.bu} · {res.department} · Last Salary: ₹{res.lastSalary.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2.5">
                      <button
                        onClick={() => setShowDecisionModal({ id: res.id, name: res.employeeName, action: "HIRE" })}
                        className="rounded bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
                      >
                        Hire Replacement
                      </button>
                      <button
                        onClick={() => setShowDecisionModal({ id: res.id, name: res.employeeName, action: "NO_HIRE" })}
                        className="rounded bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        No Hire
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Recent Activities */}
        <div>
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm h-full">
            <h2 className="text-lg font-bold text-slate-900 border-b pb-3 mb-4">Recent Position Actions</h2>
            {dashboard?.recentActivities && dashboard.recentActivities.length > 0 ? (
              <div className="space-y-4">
                {dashboard.recentActivities.map((act, index) => (
                  <div key={index} className="text-xs leading-normal">
                    <p className="font-semibold text-slate-700">{act.jobTitle} ({act.jobCode})</p>
                    <p className="text-indigo-600 mt-0.5">{act.audit.action}</p>
                    <p className="text-slate-400 mt-0.5">{new Date(act.audit.timestamp).toLocaleDateString()} · {act.audit.notes}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 py-4 text-center">No recent activities logged.</p>
            )}
          </section>
        </div>
      </div>

      {/* Decision Modal */}
      {showDecisionModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-6 border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Decision for {showDecisionModal.name}'s Replacement
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Confirm your decision. Ticking "Hire Replacement" will open the Replacement manpower requisition form.
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Colour Coding (Required)</label>
                <select
                  value={decisionColour}
                  onChange={(e) => setDecisionColour(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-sm"
                >
                  <option value="GREEN">GREEN - voluntary resignation, good standing</option>
                  <option value="RED">RED - performance-related departure</option>
                  <option value="BLACK">BLACK - serious misconduct / involuntary termination</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Reason for Departure / Leaving</label>
                <textarea
                  value={decisionReason}
                  onChange={(e) => setDecisionReason(e.target.value)}
                  placeholder="Provide context for the resignation..."
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDecisionModal(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDecisionSubmit}
                disabled={decideMutation.isPending}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/10 transition-all disabled:opacity-50"
              >
                {decideMutation.isPending ? "Saving..." : "Confirm Decision"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simulation Modal */}
      {showSimulateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleSimulateSubmit} className="w-full max-w-md bg-white rounded-xl shadow-xl p-6 border border-slate-100 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Simulate Resignation Approval</h3>
            <p className="text-xs text-slate-400">Trigger an approved resignation inside the system to populate the HM's replacement queue.</p>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-500 mb-1">Employee Name</label>
                <input value={simName} onChange={(e) => setSimName(e.target.value)} className="w-full rounded border p-2 text-sm" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Email</label>
                <input value={simEmail} onChange={(e) => setSimEmail(e.target.value)} className="w-full rounded border p-2 text-sm" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Phone</label>
                <input value={simPhone} onChange={(e) => setSimPhone(e.target.value)} className="w-full rounded border p-2 text-sm" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">BU</label>
                <input value={simBu} onChange={(e) => setSimBu(e.target.value)} className="w-full rounded border p-2 text-sm" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Department</label>
                <input value={simDept} onChange={(e) => setSimDept(e.target.value)} className="w-full rounded border p-2 text-sm" required />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-500 mb-1">Last Salary (Annual INR)</label>
                <input type="number" value={simSalary} onChange={(e) => setSimSalary(e.target.value)} className="w-full rounded border p-2 text-sm" required />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t">
              <button
                type="button"
                onClick={() => setShowSimulateModal(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={simMutation.isPending}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 shadow-md disabled:opacity-50"
              >
                {simMutation.isPending ? "Creating..." : "Submit Simulation"}
              </button>
            </div>
          </form>
        </div>
      )}
    </Layout>
  );
}

// ----------------- TALENT ACQUISITION (HR) DASHBOARD -----------------
function TaDashboard() {
  const navigate = useNavigate();
  const { data: dashboard, isLoading, isError, error: taErr, refetch } = useQuery({
    queryKey: ["ta-dashboard"],
    queryFn: getTaDashboard,
  });

  if (isError) {
    return (
      <Layout>
        <div className="max-w-md mx-auto py-16 text-center space-y-4">
          <p className="text-rose-600 font-semibold">Failed to load dashboard</p>
          <p className="text-sm text-slate-500">{(taErr as Error)?.message || "Unknown error"}</p>
          <div className="flex justify-center gap-3">
            <button onClick={() => refetch()} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Retry</button>
            <button onClick={() => window.location.reload()} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Refresh Page</button>
          </div>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout>
        <p className="text-slate-500">Loading Talent Acquisition Dashboard…</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">TA Dashboard</h1>
        <p className="text-slate-500 mt-1">Recruitment summary, approved positions queue, and candidates pipeline overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Approved (Not Posted)</div>
          <div className="text-3xl font-bold text-indigo-600 mt-2">{dashboard?.approvedNotPosted ?? 0}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Posted Vacancies</div>
          <div className="text-3xl font-bold text-emerald-600 mt-2">{dashboard?.postedPositions ?? 0}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Hires (Last 30 Days)</div>
          <div className="text-3xl font-bold text-violet-600 mt-2">{dashboard?.hiredThisMonth ?? 0}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Job Posting Backlog</h3>
            <p className="text-sm text-slate-500 mt-1">Review newly approved manpower requests and transition them to the posted state.</p>
          </div>
          <div className="mt-6">
            <button
              onClick={() => navigate("/positions?status=APPROVED")}
              className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-600/10 hover:bg-indigo-700 transition-all w-full text-center"
            >
              Mark Positions as Posted
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Review Approval Requests</h3>
            <p className="text-sm text-slate-500 mt-1">Review new requisitions routed from HMs for TA validation before final sign-off.</p>
          </div>
          <div className="mt-6">
            <button
              onClick={() => navigate("/positions?status=PENDING_APPROVAL")}
              className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-slate-900/10 hover:bg-slate-800 transition-all w-full text-center"
            >
              Go to Approval Queue
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

// ----------------- ADMIN DASHBOARD -----------------
function AdminDashboard() {
  const queryClient = useQueryClient();
  const [seeding, setSeeding] = useState(false);
  const { data: dashboard, isLoading, isError, error: adminErr, refetch } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: getAdminDashboard,
  });

  const handleSeedDatabase = async () => {
    setSeeding(true);
    try {
      await api.post<string>("/api/admin/seed", {});
      alert("Database seeded successfully!");
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
    } catch (e) {
      alert(`Seeding failed: ${(e as Error).message}`);
    } finally {
      setSeeding(false);
    }
  };

  if (isError) {
    return (
      <Layout>
        <div className="max-w-md mx-auto py-16 text-center space-y-4">
          <p className="text-rose-600 font-semibold">Failed to load dashboard</p>
          <p className="text-sm text-slate-500">{(adminErr as Error)?.message || "Unknown error"}</p>
          <div className="flex justify-center gap-3">
            <button onClick={() => refetch()} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Retry</button>
            <button onClick={() => window.location.reload()} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Refresh Page</button>
          </div>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout>
        <p className="text-slate-500">Loading Platform Admin Dashboard…</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Admin Console</h1>
          <p className="text-slate-500 mt-1">System-wide parameters, template catalog, user directory, and database health.</p>
        </div>
        <button
          onClick={handleSeedDatabase}
          disabled={seeding}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900 transition-all disabled:opacity-50"
        >
          {seeding ? "Seeding Database…" : "Reset & Seed Database"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Positions</div>
          <div className="text-3xl font-bold text-indigo-600 mt-2">{dashboard?.totalPositions ?? 0}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Active Users</div>
          <div className="text-3xl font-bold text-emerald-600 mt-2">{dashboard?.totalUsers ?? 0}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Cost Centres</div>
          <div className="text-3xl font-bold text-violet-600 mt-2">{dashboard?.totalCostCentres ?? 0}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Job Templates</div>
          <div className="text-3xl font-bold text-slate-700 mt-2">{dashboard?.totalTemplates ?? 0}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-3">Requisition Breakdown by Status</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            {Object.entries(dashboard?.statusBreakdown ?? {}).map(([status, count]) => (
              <div key={status} className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{status}</span>
                <span className="text-2xl font-extrabold text-slate-700 mt-1 block">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-3">Quick Configuration Panel</h3>
          <div className="space-y-3">
            <Link
              to="/admin/users"
              className="flex items-center justify-between rounded-lg border border-slate-200 p-3 hover:bg-slate-50 transition-colors text-sm font-semibold text-slate-700"
            >
              <span>Manage System Users</span>
              <span className="text-indigo-600">&rarr;</span>
            </Link>
            <Link
              to="/admin/templates"
              className="flex items-center justify-between rounded-lg border border-slate-200 p-3 hover:bg-slate-50 transition-colors text-sm font-semibold text-slate-700"
            >
              <span>Configure MRF Templates</span>
              <span className="text-indigo-600">&rarr;</span>
            </Link>
            <Link
              to="/admin/cost-centres"
              className="flex items-center justify-between rounded-lg border border-slate-200 p-3 hover:bg-slate-50 transition-colors text-sm font-semibold text-slate-700"
            >
              <span>Configure Cost Centres</span>
              <span className="text-indigo-600">&rarr;</span>
            </Link>
            <Link
              to="/admin/doa"
              className="flex items-center justify-between rounded-lg border border-slate-200 p-3 hover:bg-slate-50 transition-colors text-sm font-semibold text-slate-700"
            >
              <span>Manage Delegation (DoA) List</span>
              <span className="text-indigo-600">&rarr;</span>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
