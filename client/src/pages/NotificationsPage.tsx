import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "../components/Layout";
import { listNotifications, markAsRead, markAllAsRead } from "../api/notifications";
import { Link } from "react-router-dom";

export function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: listNotifications,
  });

  const readMutation = useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const readAllMutation = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const sortedNotifications = notifications?.slice().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ) ?? [];

  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notification Centre</h1>
          <p className="text-sm text-slate-500 mt-1">Stay updated on headcount approvals and candidate hiring updates.</p>
        </div>
        {sortedNotifications.some((n) => !n.isRead) && (
          <button
            onClick={() => readAllMutation.mutate()}
            disabled={readAllMutation.isPending}
            className="rounded-lg border border-slate-300 bg-white hover:bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 transition-all disabled:opacity-50"
          >
            Mark All as Read
          </button>
        )}
      </div>

      {isLoading ? (
        <p className="text-slate-500 py-8 text-center font-medium">Loading notifications inbox…</p>
      ) : sortedNotifications.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 py-12 text-center text-slate-500">
          <p className="font-medium text-slate-700">All caught up!</p>
          <p className="text-sm text-slate-400 mt-1">You have no new notifications.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedNotifications.map((n) => (
            <div
              key={n.id}
              className={`rounded-xl border p-5 shadow-sm transition-all flex items-start justify-between gap-4 ${
                n.isRead ? "bg-white border-slate-200" : "bg-indigo-50/20 border-indigo-100 ring-1 ring-indigo-50/50"
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full shrink-0 ${n.isRead ? "bg-slate-300" : "bg-indigo-600 animate-pulse"}`} />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {n.type.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="text-sm font-medium text-slate-800 leading-snug">{n.message}</p>
                <div className="flex items-center gap-3 text-[10px] text-slate-400 pt-1">
                  <span>{new Date(n.createdAt).toLocaleString()}</span>
                  <span>·</span>
                  <Link to={`/positions/${n.positionId}`} className="text-indigo-600 font-bold hover:underline">
                    View Requisition Details
                  </Link>
                </div>
              </div>

              {!n.isRead && (
                <button
                  onClick={() => readMutation.mutate(n.id)}
                  disabled={readMutation.isPending}
                  className="rounded border border-indigo-100 hover:bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 transition-colors shrink-0 disabled:opacity-50"
                >
                  Mark as Read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
