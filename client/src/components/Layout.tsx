import { useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useAuthStore } from "../store/authStore";
import { Link, NavLink } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listNotifications, markAsRead, markAllAsRead } from "../api/notifications";
import { ROLE_META } from "../utils/constants";
import type { ReactNode } from "react";

interface NavItem { to: string; label: string; roles: string[]; icon: string; end?: boolean; }

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', roles: ['HM', 'HR_TA', 'Admin'], icon: '' },
  { to: '/positions', label: 'Positions', roles: ['HM', 'HR_TA', 'Admin'], icon: '', end: true },
  { to: '/raise', label: 'Raise Position', roles: ['HM'], icon: '' },
  { to: '/notifications', label: 'Notifications', roles: ['HM', 'HR_TA', 'Admin'], icon: '' },
  { to: '/admin/positions', label: 'All Positions', roles: ['Admin'], icon: '' },
  { to: '/admin/users', label: 'Users', roles: ['Admin'], icon: '' },
  { to: '/admin/templates', label: 'MRF Templates', roles: ['Admin'], icon: '' },
  { to: '/admin/cost-centres', label: 'Cost Centres', roles: ['Admin'], icon: '' },
  { to: '/admin/doa', label: 'DoA List', roles: ['Admin'], icon: '' },
  { to: '/admin/resignations', label: 'Resignations', roles: ['Admin'], icon: '' }
];

export function Layout({ children }: { children: ReactNode }) {
  const { logout, user: auth0User } = useAuth0();
  const dbUser = useAuthStore((s) => s.user);
  const role = dbUser?.role ?? "HM";
  const roleMeta = ROLE_META[role] ?? { label: role, color: 'bg-slate-100 text-slate-700' };

  const [showDropdown, setShowDropdown] = useState(false);
  const queryClient = useQueryClient();

  const markReadMutation = useMutation({
    mutationFn: markAsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  // Polling notifications for real-time unread badge updates
  const { data: notifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: listNotifications,
    refetchInterval: 15000, // every 15s
    enabled: !!dbUser,
  });

  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex-shrink-0 flex flex-col z-20">
        <div className="px-6 py-5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded bg-brand-600 flex items-center justify-center text-white font-bold">H</div>
            <div>
              <p className="text-white font-semibold leading-tight">HRMS</p>
              <p className="text-xs text-slate-400 leading-tight">Talent Acquisition</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.filter(n => n.roles.includes(role)).map(n => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition ${
                  isActive ? 'bg-brand-600 text-white shadow-md shadow-brand-600/10' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <span className="flex-1">{n.label}</span>
              {n.to === '/notifications' && unreadCount > 0 && (
                <span className="bg-rose-500 text-[10px] font-bold text-white px-2 py-0.5 rounded-full ring-2 ring-slate-900">
                  {unreadCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User profile section at the bottom */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-9 w-9 rounded-full bg-slate-700 flex items-center justify-center font-bold text-brand-400 shrink-0 uppercase">
              {auth0User?.name?.substring(0, 2) ?? "U"}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-slate-200 truncate leading-snug">{auth0User?.name || "Active User"}</p>
              <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-semibold ${roleMeta.color}`}>
                {roleMeta.label}
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
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-20">
          <div>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${roleMeta.color}`}>
              {roleMeta.label}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick action notification indicator with Dropdown Popover */}
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                  </span>
                )}
              </button>

              {showDropdown && (
                <>
                  {/* Backdrop click closer */}
                  <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
                  
                  {/* Dropdown Card */}
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden divide-y divide-slate-100">
                    <div className="px-4 py-3 flex items-center justify-between bg-slate-50">
                      <span className="font-bold text-xs text-slate-800 uppercase tracking-wide">Notifications</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={() => {
                            markAllReadMutation.mutate();
                            setShowDropdown(false);
                          }}
                          className="text-[10px] font-bold text-indigo-600 hover:underline"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                      {(notifications?.slice(0, 5) ?? []).length > 0 ? (
                        (notifications?.slice(0, 5) ?? []).map((n) => (
                          <div
                            key={n.id}
                            onClick={() => {
                              if (!n.isRead) markReadMutation.mutate(n.id);
                              setShowDropdown(false);
                            }}
                            className={`p-3 text-xs leading-normal hover:bg-slate-50 cursor-pointer transition-colors ${
                              !n.isRead ? "bg-indigo-50/30 font-semibold text-slate-900" : "text-slate-600"
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              {!n.isRead && (
                                <span className="h-2 w-2 rounded-full bg-indigo-600 mt-1.5 shrink-0" />
                              )}
                              <div className="flex-1">
                                <p>{n.message}</p>
                                <span className="text-[10px] text-slate-400 block mt-1.5 font-medium">
                                  {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {new Date(n.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-xs text-slate-400 font-medium">
                          No notifications found.
                        </div>
                      )}
                    </div>

                    <div className="px-4 py-2 bg-slate-50 text-center">
                      <Link
                        to="/notifications"
                        onClick={() => setShowDropdown(false)}
                        className="text-[11px] font-bold text-indigo-600 hover:underline block w-full"
                      >
                        View all inbox notifications
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content Wrapper */}
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
