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
import "./App.css";

const queryClient = new QueryClient();

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
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-900 text-white">
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-tr from-indigo-400 to-violet-300">
          HRMS Talent Acquisition
        </h1>
        <p className="text-slate-400 text-sm">Welcome back. Log in to access your recruitment pipeline.</p>
        <button
          onClick={() => loginWithRedirect()}
          className="rounded-lg bg-indigo-600 px-6 py-2.5 font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all mt-4"
        >
          Sign In
        </button>
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

      <Route path="*" element={<NotAuthorizedPage />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthGate />
    </QueryClientProvider>
  );
}

export default App;
