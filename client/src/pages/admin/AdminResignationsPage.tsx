import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "../../components/Layout";
import { listPendingApprovals, approveResignation } from "../../api/resignations";
import { PageHeader, Card, Spinner, EmptyState, Button } from '../../components/ui';

export function AdminResignationsPage() {
  const queryClient = useQueryClient();

  const { data: resignations, isLoading } = useQuery({
    queryKey: ["pending-approvals"],
    queryFn: listPendingApprovals,
    refetchInterval: 30000,
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, approved }: { id: string; approved: boolean }) =>
      approveResignation(id, approved),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-approvals"] });
    },
    onError: (e) => alert(`Failed: ${(e as Error).message}`),
  });

  return (
    <Layout>
      <PageHeader
        title="Resignation Approvals"
        subtitle="Review and approve logged employee resignations"
      />

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : !resignations?.length ? (
        <EmptyState title="No pending resignations" hint="All caught up — no resignations waiting for admin approval." />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="text-left px-4 py-3">Employee</th>
                  <th className="text-left px-4 py-3">Job Title</th>
                  <th className="text-left px-4 py-3">Department</th>
                  <th className="text-left px-4 py-3">Cost Centre</th>
                  <th className="text-left px-4 py-3">Last Salary</th>
                  <th className="text-left px-4 py-3">Logged</th>
                  <th className="text-left px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {resignations.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{r.employeeName}</p>
                      <p className="text-xs text-slate-500">{r.employeeEmail}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{r.jobTitle}</td>
                    <td className="px-4 py-3 text-slate-600">{r.department}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{r.bu} ({r.costCentreId})</td>
                    <td className="px-4 py-3 text-slate-600">₹{r.lastSalary.toLocaleString()}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button
                          variant="primary"
                          onClick={() => approveMutation.mutate({ id: r.id, approved: true })}
                          disabled={approveMutation.isPending}
                          className="py-1 px-3 text-xs"
                        >
                          Approve
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => approveMutation.mutate({ id: r.id, approved: false })}
                          disabled={approveMutation.isPending}
                          className="py-1 px-3 text-xs"
                        >
                          Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </Layout>
  );
}
