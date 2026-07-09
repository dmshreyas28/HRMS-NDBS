import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "../../components/Layout";
import { listPositions } from "../../api/positions";
import { useCostCentres } from "../../hooks/useCostCentres";
import { listUsers } from "../../api/users";
import { Link } from "react-router-dom";
import { StatusBadge } from "../../components/StatusBadge";
import { PageHeader, Card, Spinner, EmptyState, Button, Select } from '../../components/ui';

export function AdminPositionsPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [costCentreFilter, setCostCentreFilter] = useState("");

  const { data: positions, isLoading: positionsLoading } = useQuery({
    queryKey: ["admin-all-positions"],
    queryFn: () => listPositions(),
  });

  const { data: costCentres } = useCostCentres();
  const { data: users } = useQuery({
    queryKey: ["admin-users-list"],
    queryFn: listUsers,
  });

  const getUserName = (userId: string) => {
    const u = users?.find((user) => user.id === userId);
    return u ? u.name : userId;
  };

  const filteredPositions = positions?.filter((p) => {
    const matchesStatus = statusFilter === "" || p.status === statusFilter;
    const matchesCostCentre = costCentreFilter === "" || p.costCentre === costCentreFilter;
    return matchesStatus && matchesCostCentre;
  }) ?? [];

  const statuses = [
    "DRAFT",
    "PENDING_APPROVAL",
    "APPROVED",
    "REJECTED",
    "ON_HOLD",
    "POSTED",
    "FILLED",
    "COLLAPSED",
  ];

  return (
    <Layout>
      <PageHeader
        title="All Positions"
        subtitle="System-wide position oversight"
      />

      {/* Filter Bar */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <Select
          label="Filter by Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          {statuses.map((s) => (
            <option key={s} value={s}>{s.replace("_", " ")}</option>
          ))}
        </Select>

        <Select
          label="Filter by Cost Centre"
          value={costCentreFilter}
          onChange={(e) => setCostCentreFilter(e.target.value)}
        >
          <option value="">All Cost Centres</option>
          {costCentres?.map((cc) => (
            <option key={cc.code} value={cc.code}>{cc.name} ({cc.code})</option>
          ))}
        </Select>
      </div>

      {positionsLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : filteredPositions.length === 0 ? (
        <EmptyState title="No positions found" hint="Try adjusting your filter criteria." />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="text-left px-4 py-3">Title</th>
                  <th className="text-left px-4 py-3">Type</th>
                  <th className="text-left px-4 py-3">Cost Centre</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Raised By</th>
                  <th className="text-left px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPositions.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link to={`/positions/${p.id}`} className="font-medium text-brand-700 hover:underline">
                        {p.jobTitle || "Untitled Position"}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-655">
                      {p.positionType === "REPLACEMENT" ? "Repl." : "New"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{p.costCentre}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-600">{getUserName(p.raisedBy)}</td>
                    <td className="px-4 py-3">
                      <Link to={`/positions/${p.id}`}>
                        <Button variant="ghost">Open →</Button>
                      </Link>
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
