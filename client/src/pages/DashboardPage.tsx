import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth0 } from "@auth0/auth0-react";
import { Layout } from "../components/Layout";
import { useAuthStore } from "../store/authStore";
import { getHmDashboard, getTaDashboard, getAdminDashboard } from "../api/dashboard";
import { listResignations, decideResignation, logResignation } from "../api/resignations";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { PageHeader, Card, Spinner, EmptyState, Button, Modal } from '../components/ui';
import { StatusBadge } from '../components/StatusBadge';
import { formatDate, normalizeRole } from '../utils/constants';
import type { Position } from '../types/models';

function MiniPosition({ p }: { p: Position }) {
  return (
    <Link to={`/positions/${p.id}`} className="block p-3 rounded-md hover:bg-slate-50 border border-transparent hover:border-slate-200">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-slate-800 truncate">{p.jobTitle || 'Untitled'}</span>
        <StatusBadge status={p.status} />
      </div>
      <div className="text-xs text-slate-500 mt-1">
        {p.costCentre} · raised by {p.raisedByName ?? '—'} · updated {formatDate(p.updatedAt)}
      </div>
    </Link>
  );
}

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { user: auth0User } = useAuth0();
  
  const rolesClaim = auth0User?.["https://hrms.app/roles"];
  const rawRole = user?.role || (Array.isArray(rolesClaim) ? rolesClaim[0] : rolesClaim);

  const role = normalizeRole(rawRole);

  if (role === "HM") return <HmDashboard />;
  if (role === "HR_TA") return <TaDashboard />;
  if (role === "Admin") return <AdminDashboard />;

  return (
    <Layout>
      <div className="p-8 text-center text-slate-500">
        <Spinner />
        <p className="mt-2 text-sm text-slate-400">Initializing your role dashboard…</p>
      </div>
    </Layout>
  );
}

// ----------------- HIRING MANAGER DASHBOARD -----------------
function HmDashboard() {
  const queryClient = useQueryClient();
  const [showLogModal, setShowLogModal] = useState(false);
  const [decisionModalState, setDecisionModalState] = useState<{ id: string; name: string; action: "HIRE" | "NO_HIRE" } | null>(null);

  // Decision Form State
  const [decisionReason, setDecisionReason] = useState("");
  const [decisionColour, setDecisionColour] = useState("GREEN");

  // Log Resignation Form State
  const [logName, setLogName] = useState("");
  const [logEmail, setLogEmail] = useState("");
  const [logPhone, setLogPhone] = useState("");
  const [logBu, setLogBu] = useState("");
  const [logDept, setLogDept] = useState("Engineering");
  const [logSalary, setLogSalary] = useState("1200000");
  const [logJobTitle, setLogJobTitle] = useState("");
  const [logCostCentreId, setLogCostCentreId] = useState("CC-001");

  const { data: dashboard, isLoading: dashLoading, isError: dashError, error: dashErr, refetch: refetchDash } = useQuery({
    queryKey: ["hm-dashboard"],
    queryFn: getHmDashboard,
  });

  const { data: resignations, isLoading: resignLoading, isError: resignError, error: resignErr, refetch: refetchResign } = useQuery({
    queryKey: ["resignations"],
    queryFn: () => listResignations(),
  });

  const logMutation = useMutation({
    mutationFn: logResignation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hm-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["resignations"] });
      setShowLogModal(false);
      setLogName(""); setLogEmail(""); setLogPhone("");
      setLogBu(""); setLogDept("Engineering"); setLogSalary("1200000");
      setLogJobTitle(""); setLogCostCentreId("CC-001");
    },
    onError: (e) => alert(`Failed to log resignation: ${(e as Error).message}`),
  });

  const decideMutation = useMutation({
    mutationFn: ({ id, decision, reason, colour }: { id: string; decision: "HIRE" | "NO_HIRE"; reason: string; colour: string }) =>
      decideResignation(id, decision, reason, colour),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hm-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["resignations"] });
      setDecisionModalState(null);
      setDecisionReason("");
    },
    onError: (e) => alert(`Decision failed: ${(e as Error).message}`),
  });

  const handleLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    logMutation.mutate({
      employeeName: logName,
      employeeEmail: logEmail,
      employeePhone: logPhone,
      bu: logBu,
      department: logDept,
      lastSalary: Number(logSalary),
      jobTitle: logJobTitle,
      costCentreId: logCostCentreId,
    });
  };

  const handleDecisionSubmit = () => {
    if (!decisionModalState) return;
    decideMutation.mutate({
      id: decisionModalState.id,
      decision: decisionModalState.action,
      reason: decisionReason,
      colour: decisionColour,
    });
  };

  if (dashError || resignError) {
    const errMsg = (dashErr as Error)?.message || (resignErr as Error)?.message || "Unknown error";
    return (
      <Layout>
        <div className="max-w-md mx-auto py-16 text-center space-y-4">
          <p className="text-rose-600 font-semibold">Failed to load dashboard</p>
          <p className="text-sm text-slate-500">{errMsg}</p>
          <div className="flex justify-center gap-3">
            <Button onClick={() => { refetchDash(); refetchResign(); }} variant="primary">Retry</Button>
            <Button onClick={() => window.location.reload()} variant="secondary">Refresh Page</Button>
          </div>
        </div>
      </Layout>
    );
  }

  if (dashLoading || resignLoading) {
    return (
      <Layout>
        <div className="flex justify-center py-12"><Spinner /></div>
      </Layout>
    );
  }

  const c = dashboard?.counts || { draft: 0, pending: 0, approved: 0, posted: 0, onHold: 0, filled: 0, collapsed: 0 };
  const pendingApprovalList = resignations?.filter((r) => r.status === "PENDING_APPROVAL") ?? [];
  const approvedList = resignations?.filter((r) => r.status === "APPROVED") ?? [];

  return (
    <Layout>
      <PageHeader 
        title="Dashboard" 
        subtitle="Your hiring activity at a glance" 
        actions={
          <Button variant="primary" onClick={() => setShowLogModal(true)}>
            Log Employee Resignation
          </Button>
        }
      />

      <div className="space-y-6">
        {/* Status Counts Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            ['Draft', c.draft], ['Pending', c.pending], ['Approved', c.approved],
            ['Posted', c.posted], ['On Hold', c.onHold], ['Filled', c.filled], ['Collapsed', c.collapsed]
          ].map(([label, val]) => (
            <Card key={label as string} className="p-4 text-center">
              <p className="text-2xl font-bold text-slate-900">{val ?? 0}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </Card>
          ))}
        </div>

        {/* Pending Approval Resignations */}
        <Card className="p-5">
          <h3 className="font-semibold text-slate-900 mb-3">Pending Approval (Awaiting Admin Review)</h3>
          {pendingApprovalList.length === 0 ? (
            <EmptyState title="No pending approvals" hint="Logged resignations appear here until an admin approves or rejects them." />
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingApprovalList.map((res) => (
                <div key={res.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-slate-800 text-sm">{res.employeeName} · {res.jobTitle}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {res.bu} · {res.department} · Last Salary: ₹{res.lastSalary.toLocaleString()}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-semibold">Awaiting Admin</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Approved Resignations (Replacement Decision) */}
        <Card className="p-5">
          <h3 className="font-semibold text-slate-900 mb-3">Approved Resignations (Awaiting Replacement Decision)</h3>
          {approvedList.length === 0 ? (
            <EmptyState title="No approved resignations" hint="Once an admin approves a resignation, you can decide to hire a replacement here." />
          ) : (
            <div className="divide-y divide-slate-100">
              {approvedList.map((res) => (
                <div key={res.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-slate-800 text-sm">{res.employeeName} · {res.jobTitle}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {res.bu} · {res.department} · Last Salary: ₹{res.lastSalary.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      onClick={() => setDecisionModalState({ id: res.id, name: res.employeeName, action: "HIRE" })}
                      className="py-1 px-2.5 text-xs"
                    >
                      Hire Replacement
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => setDecisionModalState({ id: res.id, name: res.employeeName, action: "NO_HIRE" })}
                      className="py-1 px-2.5 text-xs"
                    >
                      No Hire
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Mini Positions Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-5">
            <h3 className="font-semibold text-slate-900 mb-3">Awaiting your action</h3>
            <div className="space-y-1">
              {dashboard?.awaitingMyAction?.length ? dashboard.awaitingMyAction.map((p: Position) => <MiniPosition key={p.id} p={p} />)
                : <EmptyState title="Nothing pending" hint="Drafts and rejections show up here." />}
            </div>
          </Card>
          
          <Card className="p-5">
            <h3 className="font-semibold text-slate-900 mb-3">On hold</h3>
            <div className="space-y-2">
              {dashboard?.onHold?.length ? dashboard.onHold.map((h) => (
                <Link key={h.id} to={`/positions/${h.id}`} className="block p-3 rounded border border-slate-200 hover:bg-slate-50">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-slate-800">{h.jobTitle}</span>
                    <span className="text-xs text-purple-700 font-medium">{h.daysRemaining}d left</span>
                  </div>
                </Link>
              )) : <EmptyState title="No positions on hold" />}
            </div>
          </Card>
        </div>

        <Card className="p-5">
          <h3 className="font-semibold text-slate-900 mb-3">Open positions</h3>
          <div className="space-y-1">
            {dashboard?.openPositions?.length ? dashboard.openPositions.map((p: Position) => <MiniPosition key={p.id} p={p} />)
              : <EmptyState title="No open positions" hint="Click Raise Position to start a new MRF." />}
          </div>
        </Card>
      </div>

      {/* Decision Modal */}
      <Modal 
        open={!!decisionModalState} 
        onClose={() => setDecisionModalState(null)} 
        title={`Decision for ${decisionModalState?.name}'s Replacement`}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            {decisionModalState?.action === "HIRE"
              ? "Confirming 'Hire Replacement' logs the decision. Then go to Raise Requisition → Replacement to create the MRF."
              : "Confirm 'No Hire' to close this replacement request permanently."}
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Colour Coding</label>
              <select
                value={decisionColour}
                onChange={(e) => setDecisionColour(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2.5 text-sm bg-white"
              >
                <option value="GREEN">GREEN - voluntary resignation, good standing</option>
                <option value="RED">RED - performance-related departure</option>
                <option value="BLACK">BLACK - serious misconduct / involuntary termination</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Reason for Departure</label>
              <textarea
                value={decisionReason}
                onChange={(e) => setDecisionReason(e.target.value)}
                placeholder="Provide context for the resignation..."
                rows={3}
                className="w-full rounded-lg border border-slate-300 p-2.5 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t">
            <Button variant="secondary" onClick={() => setDecisionModalState(null)}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleDecisionSubmit}
              disabled={decideMutation.isPending}
            >
              {decideMutation.isPending ? "Saving..." : "Confirm Decision"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Log Resignation Modal */}
      <Modal open={showLogModal} onClose={() => setShowLogModal(false)} title="Log Employee Resignation">
        <form onSubmit={handleLogSubmit} className="space-y-4">
          <p className="text-xs text-slate-400">Submit a resignation record for admin approval.</p>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-500 mb-1">Employee Name</label>
              <input value={logName} onChange={(e) => setLogName(e.target.value)} className="w-full rounded border border-slate-300 p-2 text-sm" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Email</label>
              <input value={logEmail} onChange={(e) => setLogEmail(e.target.value)} className="w-full rounded border border-slate-300 p-2 text-sm" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Phone</label>
              <input value={logPhone} onChange={(e) => setLogPhone(e.target.value)} className="w-full rounded border border-slate-300 p-2 text-sm" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">BU / Cost Centre</label>
              <input value={logBu} onChange={(e) => setLogBu(e.target.value)} className="w-full rounded border border-slate-300 p-2 text-sm" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Department</label>
              <input value={logDept} onChange={(e) => setLogDept(e.target.value)} className="w-full rounded border border-slate-300 p-2 text-sm" required />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-500 mb-1">Job Title</label>
              <input value={logJobTitle} onChange={(e) => setLogJobTitle(e.target.value)} className="w-full rounded border border-slate-300 p-2 text-sm" placeholder="e.g. Senior Software Engineer" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Cost Centre ID</label>
              <input value={logCostCentreId} onChange={(e) => setLogCostCentreId(e.target.value)} className="w-full rounded border border-slate-300 p-2 text-sm" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Last Salary (Annual INR)</label>
              <input type="number" value={logSalary} onChange={(e) => setLogSalary(e.target.value)} className="w-full rounded border border-slate-300 p-2 text-sm" required />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t">
            <Button variant="secondary" onClick={() => setShowLogModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={logMutation.isPending}>
              {logMutation.isPending ? "Submitting..." : "Log Resignation"}
            </Button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}

// ----------------- TALENT ACQUISITION (HR) DASHBOARD -----------------
function TaDashboard() {
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
            <Button onClick={() => refetch()} variant="primary">Retry</Button>
            <Button onClick={() => window.location.reload()} variant="secondary">Refresh Page</Button>
          </div>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center py-12"><Spinner /></div>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHeader title="Dashboard" subtitle="Recruitment pipelines and approved positions queue" />

      <div className="space-y-6">
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="p-5">
            <p className="text-2xl font-bold text-amber-600">{dashboard?.notYetPosted?.length ?? 0}</p>
            <p className="text-sm text-slate-600">Approved, not yet posted</p>
          </Card>
          <Card className="p-5">
            <p className="text-2xl font-bold text-blue-600">{dashboard?.pendingApprovals?.length ?? 0}</p>
            <p className="text-sm text-slate-600">Approvals pending</p>
          </Card>
          <Card className="p-5">
            <p className="text-2xl font-bold text-emerald-600">{dashboard?.pipelineSummaries?.length ?? 0}</p>
            <p className="text-sm text-slate-600">Active candidate pipelines</p>
          </Card>
        </div>

        <Card className="p-5">
          <h3 className="font-semibold text-slate-900 mb-3">Not yet posted</h3>
          <div className="space-y-1">
            {dashboard?.notYetPosted?.length ? dashboard.notYetPosted.map((p: Position) => <MiniPosition key={p.id} p={p} />)
              : <EmptyState title="All approved positions have been posted" />}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold text-slate-900 mb-3">Active pipelines</h3>
          <div className="space-y-2">
            {dashboard?.pipelineSummaries?.length ? dashboard.pipelineSummaries.map((s) => (
              <Link key={s.id} to={`/positions/${s.id}/candidates`} className="block p-3 rounded border border-slate-200 hover:bg-slate-50">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-slate-800">{s.jobTitle}</span>
                  <span className="text-xs text-slate-500">{s.total} candidate{s.total !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex gap-1 mt-2 flex-wrap">
                  {Object.entries(s.byStage ?? {}).map(([stage, n]) => (
                    <span key={stage} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-medium">{stage.replace(/_/g, ' ')}: {n}</span>
                  ))}
                </div>
              </Link>
            )) : <EmptyState title="No active pipelines" hint="Positions appear here once posted." />}
          </div>
        </Card>
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
            <Button onClick={() => refetch()} variant="primary">Retry</Button>
            <Button onClick={() => window.location.reload()} variant="secondary">Refresh Page</Button>
          </div>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center py-12"><Spinner /></div>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHeader 
        title="Admin Console" 
        subtitle="System overview and seeding parameters" 
        actions={
          <Button variant="secondary" onClick={handleSeedDatabase} disabled={seeding}>
            {seeding ? "Seeding Database…" : "Reset & Seed Database"}
          </Button>
        }
      />

      <div className="space-y-6">
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="p-5">
            <p className="text-2xl font-bold text-slate-900">{dashboard?.totalPositions ?? 0}</p>
            <p className="text-sm text-slate-600">Total positions</p>
          </Card>
          <Card className="p-5">
            <p className="text-2xl font-bold text-slate-900">{dashboard?.totalUsers ?? 0}</p>
            <p className="text-sm text-slate-600">Total users</p>
          </Card>
          <Card className="p-5">
            <p className="text-2xl font-bold text-red-600">{dashboard?.approachingCollapse?.length ?? 0}</p>
            <p className="text-sm text-slate-600">Approaching auto-collapse</p>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-5">
            <h3 className="font-semibold text-slate-900 mb-3">Positions by status</h3>
            <div className="space-y-1.5">
              {Object.entries(dashboard?.byStatus ?? {}).map(([status, n]) => (
                <div key={status} className="flex justify-between items-center py-0.5 border-b border-slate-50 last:border-0">
                  <StatusBadge status={status as import('../types/models').PositionStatus} />
                  <span className="font-semibold text-slate-800">{n}</span>
                </div>
              ))}
            </div>
          </Card>
          
          <Card className="p-5">
            <h3 className="font-semibold text-slate-900 mb-3">Users by role</h3>
            <div className="space-y-1.5">
              {Object.entries(dashboard?.usersByRole ?? {}).map(([role, n]) => (
                <div key={role} className="flex justify-between text-sm py-1 border-b border-slate-50 last:border-0">
                  <span className="text-slate-600 font-medium">{role}</span>
                  <span className="font-semibold text-slate-800">{n}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card className="p-5">
          <h3 className="font-semibold text-slate-900 mb-3">Approaching collapse (≥150 days inactive)</h3>
          <div className="space-y-1">
            {dashboard?.approachingCollapse?.length ? dashboard.approachingCollapse.map((p) => (
              <Link key={p.id} to={`/positions/${p.id}`} className="block p-3 rounded border border-slate-200 hover:bg-slate-50">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-slate-800">{p.jobTitle}</span>
                  <span className={`text-xs font-medium ${p.daysSince >= 170 ? 'text-red-600' : 'text-amber-600'}`}>
                    {p.daysSince} days inactive
                  </span>
                </div>
              </Link>
            )) : <EmptyState title="Nothing approaching collapse" />}
          </div>
        </Card>
      </div>
    </Layout>
  );
}
