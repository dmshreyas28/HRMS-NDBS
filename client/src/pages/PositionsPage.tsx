import { useQuery } from "@tanstack/react-query";
import { Layout } from "../components/Layout";
import { listPositions } from "../api/positions";
import { StatusBadge } from "../components/StatusBadge";
import { Link, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export function PositionsPage() {
  const user = useAuthStore((s) => s.user);
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = searchParams.get("status") || "";

  const { data: positions, isLoading } = useQuery({
    queryKey: ["positions", statusFilter],
    queryFn: () => listPositions(statusFilter as any),
  });

  const handleStatusChange = (val: string) => {
    if (val === "") {
      searchParams.delete("status");
    } else {
      searchParams.set("status", val);
    }
    setSearchParams(searchParams);
  };

  return (
    <Layout>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manpower Requisitions</h1>
          <p className="text-sm text-slate-500 mt-1">Track and manage recruitment headcount across your division.</p>
        </div>

        {user?.role === "HM" && (
          <Link
            to="/raise/new"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-600/10 hover:bg-indigo-700 transition-all text-center self-start sm:self-auto"
          >
            Raise New Position
          </Link>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="mb-6 flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white p-2 text-sm"
          >
            <option value="">All Requisitions</option>
            <option value="DRAFT">Drafts</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="APPROVED">Approved</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="POSTED">Posted (ATS)</option>
            <option value="FILLED">Filled / Closed</option>
            <option value="REJECTED">Rejected</option>
            <option value="COLLAPSED">Collapsed</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <p className="text-slate-500 py-8 text-center">Loading requisitions…</p>
      ) : !positions || positions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 py-12 text-center text-slate-500">
          <p className="font-medium text-slate-700">No requisitions found</p>
          <p className="text-sm text-slate-400 mt-1">No headcount requests match the selected status.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {positions.map((pos) => (
            <div key={pos.id} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="inline-block text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded px-2 py-0.5 uppercase tracking-wider">
                    {pos.positionType === "NEW_HIRE" ? "New Hire" : "Replacement"}
                  </span>
                  <StatusBadge status={pos.status} />
                </div>
                <h3 className="text-lg font-bold text-slate-800 line-clamp-1">{pos.jobTitle || "Untitled Position"}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{pos.jobCode} · {pos.division}</p>

                <div className="mt-4 grid grid-cols-2 gap-y-2.5 text-xs text-slate-600 border-t pt-4">
                  <div>
                    <span className="font-semibold block text-slate-400">Location</span>
                    <span className="mt-0.5 block">{pos.location || "—"}</span>
                  </div>
                  <div>
                    <span className="font-semibold block text-slate-400">StartDate</span>
                    <span className="mt-0.5 block">{pos.requiredStartDate ? new Date(pos.requiredStartDate).toLocaleDateString() : "—"}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="font-semibold block text-slate-400">Salary Budget (INR)</span>
                    <span className="mt-0.5 block">
                      ₹{pos.salaryRange.min.toLocaleString()} - ₹{pos.salaryRange.max.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t pt-4 gap-2">
                <span className="text-[10px] text-slate-400">Updated {new Date(pos.updatedAt).toLocaleDateString()}</span>
                <div className="flex gap-2">
                  {pos.status === "DRAFT" ? (
                    <Link
                      to={`/raise/${pos.id}`}
                      className="rounded border border-indigo-600 text-indigo-600 px-3 py-1.5 text-xs font-semibold hover:bg-indigo-50"
                    >
                      Edit Draft
                    </Link>
                  ) : (
                    <>
                      <Link
                        to={`/positions/${pos.id}`}
                        className="rounded border border-slate-300 text-slate-700 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50"
                      >
                        View Details
                      </Link>
                      {(pos.status === "POSTED" || pos.status === "APPROVED" || pos.status === "FILLED") && (
                        <Link
                          to={`/positions/${pos.id}/candidates`}
                          className="rounded bg-indigo-600 text-white px-3 py-1.5 text-xs font-semibold hover:bg-indigo-700"
                        >
                          Candidates
                        </Link>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
