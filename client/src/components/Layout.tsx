import { useAuth0 } from "@auth0/auth0-react";
import { useAuthStore } from "../store/authStore";
import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listNotifications } from "../api/notifications";
import type { ReactNode } from "react";

export function Layout({ children }: { children: ReactNode }) {
  const { logout, user: auth0User } = useAuth0();
  const dbUser = useAuthStore((s) => s.user);
  const roleLabel = dbUser?.role ?? "—";
  const location = useLocation();

  // Polling notifications for real-time unread badge updates
  const { data: notifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: listNotifications,
    refetchInterval: 15000, // every 15s
    enabled: !!dbUser,
  });

  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;

  const isActive = (path: string) => location.pathname.startsWith(path);

  const linkClass = (path: string) =>
    `flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
      isActive(path)
        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
        : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
    }`;

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900 text-slate-100 flex flex-col shrink-0">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/30">
            TA
          </div>
          <div>
            <h2 className="font-semibold text-white leading-tight">HRMS Talent</h2>
            <span className="text-xs text-slate-400 font-medium">Acquisition</span>
          </div>
        </div>

        <nav className="flex-1 space-y-1.5 px-4 py-6">
          <Link to="/dashboard" className={linkClass("/dashboard")}>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
            </svg>
            Dashboard
          </Link>

          <Link to="/positions" className={linkClass("/positions")}>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Positions
          </Link>

          {dbUser?.role === "HM" && (
            <Link to="/raise" className={linkClass("/raise")}>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Raise Requisition
            </Link>
          )}

          <Link to="/notifications" className={linkClass("/notifications")}>
            <div className="relative flex items-center justify-between w-full">
              <span className="flex items-center gap-3">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="absolute right-0 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-slate-900">
                  {unreadCount}
                </span>
              )}
            </div>
          </Link>

          {/* Admin Panel Sections */}
          {dbUser?.role === "Admin" && (
            <div className="pt-6 mt-6 border-t border-slate-800">
              <span className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-3">
                System Administration
              </span>
              <div className="space-y-1.5">
                <Link to="/admin/users" className={linkClass("/admin/users")}>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Users
                </Link>
                <Link to="/admin/templates" className={linkClass("/admin/templates")}>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  MRF Templates
                </Link>
                <Link to="/admin/cost-centres" className={linkClass("/admin/cost-centres")}>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Cost Centres
                </Link>
                <Link to="/admin/doa" className={linkClass("/admin/doa")}>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Delegation (DoA)
                </Link>
              </div>
            </div>
          )}
        </nav>

        {/* User profile section at the bottom */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-9 w-9 rounded-full bg-slate-700 flex items-center justify-center font-bold text-indigo-400 shrink-0 uppercase">
              {auth0User?.name?.substring(0, 2) ?? "U"}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-slate-200 truncate leading-snug">{auth0User?.name || "Active User"}</p>
              <span className="inline-block rounded bg-indigo-950/80 px-2 py-0.5 text-[10px] font-semibold text-indigo-300 ring-1 ring-indigo-500/30">
                {roleLabel}
              </span>
            </div>
          </div>
          <button
            onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
            className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            title="Log Out"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-8 shadow-sm shadow-slate-100 shrink-0">
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-400 font-semibold tracking-wider uppercase">
              Platform Integration
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick action notification indicator */}
            <Link to="/notifications" className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
              )}
            </Link>
          </div>
        </header>

        {/* Content Wrapper */}
        <main className="flex-1 overflow-y-auto px-8 py-8">
          <div className="max-w-5xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
