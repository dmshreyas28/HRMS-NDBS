import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "../components/Layout";
import { listNotifications, markAsRead, markAllAsRead } from "../api/notifications";
import { Link } from "react-router-dom";
import { PageHeader, Card, Spinner, EmptyState, Button } from '../components/ui';

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
      <PageHeader
        title="Notification Centre"
        subtitle="Stay updated on headcount approvals and candidate hiring updates"
        actions={
          sortedNotifications.some((n) => !n.isRead) && (
            <Button
              variant="secondary"
              onClick={() => readAllMutation.mutate()}
              disabled={readAllMutation.isPending}
            >
              Mark All as Read
            </Button>
          )
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : sortedNotifications.length === 0 ? (
        <EmptyState title="All caught up!" hint="You have no new notifications." />
      ) : (
        <div className="space-y-4">
          {sortedNotifications.map((n) => (
            <Card
              key={n.id}
              className={`p-5 transition-all flex items-start justify-between gap-4 ${
                n.isRead ? "bg-white border-slate-200" : "bg-brand-50/20 border-brand-100 ring-1 ring-brand-50/50"
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full shrink-0 ${n.isRead ? "bg-slate-300" : "bg-brand-600 animate-pulse"}`} />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {n.type.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="text-sm font-medium text-slate-800 leading-snug">{n.message}</p>
                <div className="flex items-center gap-3 text-[10px] text-slate-400 pt-1">
                  <span>{new Date(n.createdAt).toLocaleString()}</span>
                  <span>·</span>
                  <Link to={`/positions/${n.positionId}`} className="text-brand-700 font-bold hover:underline">
                    View Requisition Details
                  </Link>
                </div>
              </div>

              {!n.isRead && (
                <Button
                  variant="secondary"
                  onClick={() => readMutation.mutate(n.id)}
                  disabled={readMutation.isPending}
                  className="py-1 px-3 text-xs"
                >
                  Mark as Read
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}
    </Layout>
  );
}
