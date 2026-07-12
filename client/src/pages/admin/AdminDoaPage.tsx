import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "../../components/Layout";
import { listDoa, createDoa, updateDoa } from "../../api/doa";

export function AdminDoaPage() {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any>(null);

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [isActive, setIsActive] = useState(true);

  const { data: entries, isLoading } = useQuery({
    queryKey: ["doa"],
    queryFn: listDoa,
  });

  const createMutation = useMutation({
    mutationFn: createDoa,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doa"] });
      setShowAddModal(false);
      resetForm();
    },
    onError: (e) => alert(`Failed to add approver: ${(e as Error).message}`),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateDoa(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doa"] });
      setEditingEntry(null);
      resetForm();
    },
    onError: (e) => alert(`Failed to update approver: ${(e as Error).message}`),
  });

  const resetForm = () => {
    setName("");
    setEmail("");
    setTitle("");
    setIsActive(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ name, email, title, isActive });
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry) return;
    updateMutation.mutate({
      id: editingEntry.id,
      data: { name, email, title, isActive },
    });
  };

  const handleEditClick = (entry: any) => {
    setEditingEntry(entry);
    setName(entry.name);
    setEmail(entry.email);
    setTitle(entry.title);
    setIsActive(entry.isActive);
  };

  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Delegation of Authority (DoA)</h1>
          <p className="text-sm text-slate-500 mt-1">Configure company executive approvers list.</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 shadow-md"
        >
          Add Approver
        </button>
      </div>

      {isLoading ? (
        <p className="text-slate-500 py-8 text-center">Loading Delegation of Authority registry…</p>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm text-slate-600 border-collapse">
            <thead className="bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider border-b">
              <tr>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Title</th>
                <th className="px-6 py-3">Email Address</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entries?.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-semibold text-slate-800">{d.name}</td>
                  <td className="px-6 py-4">{d.title}</td>
                  <td className="px-6 py-4 font-mono text-xs">{d.email}</td>
                  <td className="px-6 py-4">
                    <span className={`h-2.5 w-2.5 rounded-full inline-block ${d.isActive ? "bg-emerald-500" : "bg-slate-300"}`} />
                    <span className="ml-1.5 text-xs">{d.isActive ? "Active Approver" : "Inactive"}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleEditClick(d)} className="text-indigo-600 font-bold hover:underline">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Modal */}
      {(showAddModal || editingEntry) && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={showAddModal ? handleCreateSubmit : handleUpdateSubmit} className="w-full max-w-md bg-white rounded-xl shadow-xl p-6 border border-slate-100 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">{showAddModal ? "Add Executive Approver" : "Edit Approver"}</h3>

            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Full Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Priha Sen" className="w-full rounded border p-2" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Corporate Title</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. VP Engineering" className="w-full rounded border p-2" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Corporate Email Address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e.g. priha.sen@hrms.dev" className="w-full rounded border p-2" required />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" id="isActive" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                <label htmlFor="isActive" className="text-sm font-semibold text-slate-600">Active status (available for approval selection)</label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t">
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingEntry(null);
                }}
                className="rounded-lg border px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 shadow-md">
                Save Approver
              </button>
            </div>
          </form>
        </div>
      )}
    </Layout>
  );
}
