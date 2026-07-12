import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "../../components/Layout";
import { api } from "../../api/client";

export function AdminCostCentresPage() {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCc, setEditingCc] = useState<any>(null);

  // Form State
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [isActive, setIsActive] = useState(true);

  const { data: costCentres, isLoading } = useQuery({
    queryKey: ["cost-centres"],
    queryFn: () => api.get<any[]>("/api/cost-centres"),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post<any>("/api/cost-centres", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cost-centres"] });
      setShowAddModal(false);
      resetForm();
    },
    onError: (e) => alert(`Failed to create cost centre: ${(e as Error).message}`),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put<any>(`/api/cost-centres/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cost-centres"] });
      setEditingCc(null);
      resetForm();
    },
    onError: (e) => alert(`Failed to update cost centre: ${(e as Error).message}`),
  });

  const resetForm = () => {
    setCode("");
    setName("");
    setDepartment("");
    setIsActive(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ code, name, department, isActive });
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCc) return;
    updateMutation.mutate({
      id: editingCc.id,
      data: { code, name, department, isActive },
    });
  };

  const handleEditClick = (cc: any) => {
    setEditingCc(cc);
    setCode(cc.code);
    setName(cc.name);
    setDepartment(cc.department);
    setIsActive(cc.isActive);
  };

  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cost Centre Directory</h1>
          <p className="text-sm text-slate-500 mt-1">Configure company divisions and associated codes.</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 shadow-md"
        >
          Add Cost Centre
        </button>
      </div>

      {isLoading ? (
        <p className="text-slate-500 py-8 text-center">Loading cost centres catalog…</p>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm text-slate-600 border-collapse">
            <thead className="bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider border-b">
              <tr>
                <th className="px-6 py-3">Code</th>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Department</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {costCentres?.map((cc) => (
                <tr key={cc.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-mono font-bold text-xs text-slate-800">{cc.code}</td>
                  <td className="px-6 py-4 font-semibold text-slate-800">{cc.name}</td>
                  <td className="px-6 py-4">{cc.department}</td>
                  <td className="px-6 py-4">
                    <span className={`h-2.5 w-2.5 rounded-full inline-block ${cc.isActive ? "bg-emerald-500" : "bg-slate-300"}`} />
                    <span className="ml-1.5 text-xs">{cc.isActive ? "Active" : "Inactive"}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleEditClick(cc)} className="text-indigo-600 font-bold hover:underline">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Modal */}
      {(showAddModal || editingCc) && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={showAddModal ? handleCreateSubmit : handleUpdateSubmit} className="w-full max-w-md bg-white rounded-xl shadow-xl p-6 border border-slate-100 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">{showAddModal ? "Create Cost Centre" : "Edit Cost Centre"}</h3>

            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Cost Centre Code</label>
                <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. CC-101" className="w-full rounded border p-2" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Software Development" className="w-full rounded border p-2" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Department</label>
                <input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. Technology" className="w-full rounded border p-2" required />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" id="isActive" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                <label htmlFor="isActive" className="text-sm font-semibold text-slate-600">Active status (available for new templates)</label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t">
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingCc(null);
                }}
                className="rounded-lg border px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 shadow-md">
                Save Cost Centre
              </button>
            </div>
          </form>
        </div>
      )}
    </Layout>
  );
}
