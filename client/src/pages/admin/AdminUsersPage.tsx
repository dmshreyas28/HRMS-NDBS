import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "../../components/Layout";
import { listUsers, createUser, updateUser, deleteUser } from "../../api/users";
import { useCostCentres } from "../../hooks/useCostCentres";

export function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Form State
  const [auth0Id, setAuth0Id] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("HM");
  const [costCentre, setCostCentre] = useState("");
  const [department, setDepartment] = useState("");

  const { data: users, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: listUsers,
  });

  const { data: costCentres } = useCostCentres();

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setShowAddModal(false);
      resetForm();
    },
    onError: (e) => alert(`Failed to create user: ${(e as Error).message}`),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setEditingUserId(null);
      resetForm();
    },
    onError: (e) => alert(`Failed to update user: ${(e as Error).message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (e) => alert(`Failed to deactivate user: ${(e as Error).message}`),
  });

  const resetForm = () => {
    setAuth0Id("");
    setName("");
    setEmail("");
    setRole("HM");
    setCostCentre("");
    setDepartment("");
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      auth0Id,
      name,
      email,
      role: role as any,
      costCentre: costCentre || null,
      department: department || null,
      isActive: true,
    });
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserId) return;
    updateMutation.mutate({
      id: editingUserId,
      data: {
        name,
        email,
        role: role as any,
        costCentre: costCentre || null,
        department: department || null,
      },
    });
  };

  const handleEditClick = (u: any) => {
    setEditingUserId(u.id);
    setAuth0Id(u.auth0Id);
    setName(u.name);
    setEmail(u.email);
    setRole(u.role);
    setCostCentre(u.costCentre || "");
    setDepartment(u.department || "");
  };

  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-sm text-slate-500 mt-1">Configure Auth0 users, roles, and cost centre alignments.</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 shadow-md"
        >
          Add User
        </button>
      </div>

      {isLoading ? (
        <p className="text-slate-500 py-8 text-center">Loading users catalog…</p>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm text-slate-600 border-collapse">
            <thead className="bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider border-b">
              <tr>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Cost Centre</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users?.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-semibold text-slate-800">{u.name}</td>
                  <td className="px-6 py-4">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className="rounded bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-0.5 text-xs font-semibold">
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs">{u.costCentre || "—"}</td>
                  <td className="px-6 py-4">
                    <span className={`h-2.5 w-2.5 rounded-full inline-block ${u.isActive ? "bg-emerald-500" : "bg-slate-300"}`}></span>
                    <span className="ml-1.5 text-xs">{u.isActive ? "Active" : "Deactivated"}</span>
                  </td>
                  <td className="px-6 py-4 text-right flex gap-3 justify-end">
                    <button
                      onClick={() => handleEditClick(u)}
                      className="text-indigo-600 font-bold hover:underline"
                    >
                      Edit
                    </button>
                    {u.isActive && (
                      <button
                        onClick={() => deleteMutation.mutate(u.id)}
                        className="text-rose-600 font-bold hover:underline"
                      >
                        Deactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateSubmit} className="w-full max-w-md bg-white rounded-xl shadow-xl p-6 border border-slate-100 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Add New User</h3>
            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Auth0 Subject ID</label>
                <input value={auth0Id} onChange={(e) => setAuth0Id(e.target.value)} placeholder="e.g. auth0|65f..." className="w-full rounded border p-2" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded border p-2" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded border p-2" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">System Role</label>
                <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full rounded border p-2">
                  <option value="HM">Hiring Manager (HM)</option>
                  <option value="HR_TA">Talent Acquisition (HR_TA)</option>
                  <option value="Admin">Platform Administrator</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Cost Centre</label>
                <select value={costCentre} onChange={(e) => setCostCentre(e.target.value)} className="w-full rounded border p-2">
                  <option value="">None</option>
                  {costCentres?.map((cc) => (
                    <option key={cc.id} value={cc.code}>{cc.code} - {cc.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Department</label>
                <input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. Engineering" className="w-full rounded border p-2" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t">
              <button type="button" onClick={() => setShowAddModal(false)} className="rounded-lg border px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
              <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Create User</button>
            </div>
          </form>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUserId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleUpdateSubmit} className="w-full max-w-md bg-white rounded-xl shadow-xl p-6 border border-slate-100 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Edit User Mapping</h3>
            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded border p-2" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded border p-2" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">System Role</label>
                <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full rounded border p-2">
                  <option value="HM">Hiring Manager (HM)</option>
                  <option value="HR_TA">Talent Acquisition (HR_TA)</option>
                  <option value="Admin">Platform Administrator</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Cost Centre</label>
                <select value={costCentre} onChange={(e) => setCostCentre(e.target.value)} className="w-full rounded border p-2">
                  <option value="">None</option>
                  {costCentres?.map((cc) => (
                    <option key={cc.id} value={cc.code}>{cc.code} - {cc.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Department</label>
                <input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. Engineering" className="w-full rounded border p-2" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t">
              <button type="button" onClick={() => setEditingUserId(null)} className="rounded-lg border px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
              <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Save Changes</button>
            </div>
          </form>
        </div>
      )}
    </Layout>
  );
}
