import { useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate } from "react-router-dom";
import { setTokenGetter } from "./api/client";
import { useCurrentUser } from "./hooks/useCurrentUser";
import { RequireRole } from "./components/RequireRole";
import { RaiseListPage } from "./pages/RaiseListPage";
import { RaiseFormPage } from "./pages/RaiseFormPage";
import { ApprovalsPage } from "./pages/ApprovalsPage";
import { NotAuthorizedPage } from "./pages/NotAuthorizedPage";
import { DashboardPage } from "./pages/DashboardPage";
import { PositionsPage } from "./pages/PositionsPage";
import { PositionDetailPage } from "./pages/PositionDetailPage";
import { CandidatesPage } from "./pages/CandidatesPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { AdminUsersPage } from "./pages/admin/AdminUsersPage";
import { AdminTemplatesPage } from "./pages/admin/AdminTemplatesPage";
import { AdminCostCentresPage } from "./pages/admin/AdminCostCentresPage";
import { AdminDoaPage } from "./pages/admin/AdminDoaPage";
import { AdminPositionsPage } from "./pages/admin/AdminPositionsPage";
import { ToastContainer } from "./components/ToastContainer";
import "./App.css";

const queryClient = new QueryClient();

const DEMO_PROFILES = [
  {
    roleName: "Hiring Manager",
    email: "hm@example.com",
    description: "Raise headcounts, track approvals, and manage resignation replacement decisions.",
    role: "HM",
    badgeBg: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  },
  {
    roleName: "HR/TA Recruiter",
    email: "ta@example.com",
    description: "Publish vacancies, overview approved requisitions, and track candidate pipeline.",
    role: "HR_TA",
    badgeBg: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  },
  {
    roleName: "System Administrator",
    email: "admin@example.com",
    description: "Configure system templates, cost centres, user directory, and Delegation of Authority.",
    role: "Admin",
    badgeBg: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  },
];

function AuthGate() {
  const { isAuthenticated, isLoading, loginWithRedirect, getAccessTokenSilently } = useAuth0();

  useEffect(() => {
    setTokenGetter(getAccessTokenSilently);
  }, [getAccessTokenSilently]);

  useCurrentUser(isLoading);

  if (isLoading) {
    return <div className="p-8 text-gray-600">Loading…</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12 text-slate-900">
        <div className="w-full max-w-2xl text-center space-y-4 mb-8">
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-600 via-indigo-500 to-indigo-600">
            HRMS Talent Acquisition
          </h1>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            Choose a profile below to pre-fill your Auth0 login details, or sign in manually.
          </p>
        </div>

        <div className="grid w-full max-w-2xl gap-4 grid-cols-1 md:grid-cols-3 mb-8">
          {DEMO_PROFILES.map((p) => (
            <button
              key={p.role}
              onClick={() => loginWithRedirect({ authorizationParams: { login_hint: p.email, prompt: "login" } })}
              className="flex flex-col text-left rounded-xl border border-slate-200 bg-white p-5 hover:border-brand-500/50 hover:shadow-md transition-all duration-200 group shadow-sm cursor-pointer"
            >
              <div className="flex items-center justify-between gap-2 mb-2 w-full">
                <span className={`rounded border px-2 py-0.5 text-[10px] font-bold ${p.badgeBg}`}>
                  {p.roleName}
                </span>
              </div>
              <p className="font-mono text-xs font-semibold text-slate-700 group-hover:text-brand-600 transition-colors mb-2">
                {p.email}
              </p>
              <p className="text-slate-500 text-[11px] leading-relaxed mt-auto">
                {p.description}
              </p>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 w-full max-w-md justify-center border-t border-slate-200 pt-6">
          <button
            onClick={() => loginWithRedirect({ authorizationParams: { prompt: "login" } })}
            className="rounded-lg bg-white hover:bg-slate-50 border border-slate-300 px-6 py-2.5 text-xs font-bold text-slate-700 transition-all hover:border-slate-400"
          >
            Sign In Manually
          </button>
        </div>
      </div>
    );
  }

  const home = "/dashboard";

  return (
    <Routes>
      <Route path="/" element={<Navigate to={home} replace />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/positions" element={<PositionsPage />} />
      <Route path="/positions/:id" element={<PositionDetailPage />} />
      <Route path="/positions/:id/candidates" element={<CandidatesPage />} />
      <Route path="/notifications" element={<NotificationsPage />} />
      
      <Route
        path="/raise"
        element={
          <RequireRole roles={["HM"]}>
            <RaiseListPage />
          </RequireRole>
        }
      />
      <Route
        path="/raise/:id"
        element={
          <RequireRole roles={["HM"]}>
            <RaiseFormPage />
          </RequireRole>
        }
      />
      <Route
        path="/approvals"
        element={
          <RequireRole roles={["Admin", "HR_TA"]}>
            <ApprovalsPage />
          </RequireRole>
        }
      />

      {/* Admin Panel config */}
      <Route
        path="/admin/users"
        element={
          <RequireRole roles={["Admin"]}>
            <AdminUsersPage />
          </RequireRole>
        }
      />
      <Route
        path="/admin/templates"
        element={
          <RequireRole roles={["Admin"]}>
            <AdminTemplatesPage />
          </RequireRole>
        }
      />
      <Route
        path="/admin/cost-centres"
        element={
          <RequireRole roles={["Admin"]}>
            <AdminCostCentresPage />
          </RequireRole>
        }
      />
      <Route
        path="/admin/doa"
        element={
          <RequireRole roles={["Admin"]}>
            <AdminDoaPage />
          </RequireRole>
        }
      />
      <Route
        path="/admin/positions"
        element={
          <RequireRole roles={["Admin"]}>
            <AdminPositionsPage />
          </RequireRole>
        }
      />

      <Route path="*" element={<NotAuthorizedPage />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthGate />
      <ToastContainer />
    </QueryClientProvider>
  );
}

export default App;
