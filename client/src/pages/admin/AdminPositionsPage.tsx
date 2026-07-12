import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "../../components/Layout";
import { listPositions } from "../../api/positions";
import { useCostCentres } from "../../hooks/useCostCentres";
import { listUsers } from "../../api/users";
import { Link } from "react-router-dom";
import { StatusBadge } from "../../components/StatusBadge";

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
      <div className="mb-6 border-b pb-4">
        <h1 className="text-2xl font-bold text-slate-900">Positions Oversight</h1>
        <p className="text-sm text-slate-500 mt-1">System-wide directory of all requisition pipelines across the organization.</p>
      </div>

      {/* Filter Bar */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Filter by Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-lg border border-slate-200 p-2 text-sm text-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Statuses</option>
            {statuses.map((s) => (
              <option key={s} value={s}>{s.replace("_", " ")}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Filter by Cost Centre</label>
          <select
            value={costCentreFilter}
            onChange={(e) => setCostCentreFilter(e.target.value)}
            className="w-full rounded-lg border border-slate-200 p-2 text-sm text-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Cost Centres</option>
            {costCentres?.map((cc) => (
              <option key={cc.code} value={cc.code}>{cc.name} ({cc.code})</option>
            ))}
          </select>
        </div>

        <div className="flex items-end justify-end md:col-span-1 sm:col-span-2">
          <span className="text-xs text-slate-400 font-semibold mb-2">
            Showing {filteredPositions.length} of {positions?.length ?? 0} positions
          </span>
        </div>
      </div>

      {positionsLoading ? (
        <p className="text-slate-500 py-8 text-center">Loading organizational positions archive…</p>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm text-slate-600 border-collapse">
            <thead className="bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider border-b">
              <tr>
                <th className="px-6 py-3">Job Code</th>
                <th className="px-6 py-3">Job Title</th>
                <th className="px-6 py-3">Raised By</th>
                <th className="px-6 py-3">Cost Centre</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPositions.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-mono font-bold text-xs text-slate-800">{p.jobCode}</td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-slate-800 block">{p.jobTitle || "Untitled Position"}</span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">{p.division}</span>
                  </td>
                  <td className="px-6 py-4 text-xs font-medium">{getUserName(p.raisedBy)}</td>
                  <td className="px-6 py-4 text-xs font-bold font-mono">{p.costCentre}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      p.positionType === "REPLACEMENT"
                        ? "bg-rose-50 border-rose-100 text-rose-700"
                        : "bg-indigo-50 border-indigo-100 text-indigo-700"
                    }`}>
                      {p.positionType === "REPLACEMENT" ? "Replacement" : "New Hire"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      to={`/positions/${p.id}`}
                      className="text-indigo-600 font-bold hover:underline text-xs bg-slate-50 border hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors inline-block"
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
              {filteredPositions.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400 text-sm">
                    No positions match your selected filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
}
