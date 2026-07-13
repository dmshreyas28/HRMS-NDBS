import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "../../components/Layout";
import { listUsers, createUser, updateUser, deleteUser } from "../../api/users";
import { useCostCentres } from "../../hooks/useCostCentres";
import { PageHeader, Card, Spinner, EmptyState, Button, Modal, Input, Select } from '../../components/ui';

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
      alert("User created successfully.");
    },
    onError: (e) => alert(`Failed to create user: ${(e as Error).message}`),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setEditingUserId(null);
      resetForm();
      alert("User updated successfully.");
    },
    onError: (e) => alert(`Failed to update user: ${(e as Error).message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      alert("User deactivated successfully.");
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
      <PageHeader
        title="User Management"
        subtitle="Invite users and assign roles"
        actions={
          <Button
            variant="primary"
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
          >
            Invite user
          </Button>
        }
      />

      <Card>
        {isLoading ? (
          <Spinner />
        ) : !users?.length ? (
          <EmptyState title="No users" hint="Invite your first platform user." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="text-left px-4 py-3">Name</th>
                  <th className="text-left px-4 py-3">Email</th>
                  <th className="text-left px-4 py-3">Role</th>
                  <th className="text-left px-4 py-3">Cost Centre</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{u.name}</td>
                    <td className="px-4 py-3 text-slate-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-brand-50 border border-brand-100 text-brand-700 px-2 py-0.5 text-xs font-semibold">
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{u.costCentre || "—"}</td>
                    <td className="px-4 py-3 text-slate-600">
                      <span className={`h-2 w-2 rounded-full inline-block ${u.isActive ? "bg-emerald-500" : "bg-slate-300"}`} />
                      <span className="ml-1.5 text-xs">{u.isActive ? "Active" : "Inactive"}</span>
                    </td>
                    <td className="px-4 py-3 flex gap-2">
                      <Button variant="ghost" onClick={() => handleEditClick(u)}>
                        Edit
                      </Button>
                      {u.isActive && (
                        <Button variant="ghost" onClick={() => deleteMutation.mutate(u.id)}>
                          Deactivate
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add User Modal */}
      <Modal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Invite user"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <Input
            label="Auth0 Subject ID"
            value={auth0Id}
            onChange={(e) => setAuth0Id(e.target.value)}
            placeholder="e.g. auth0|65f..."
            required
          />
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            type="email"
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Select
            label="Role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            required
          >
            <option value="HM">Hiring Manager</option>
            <option value="HR_TA">HR / Talent Acquisition</option>
            <option value="Admin">Admin</option>
          </Select>
          <Select
            label="Cost centre"
            value={costCentre}
            onChange={(e) => setCostCentre(e.target.value)}
          >
            <option value="">None</option>
            {costCentres?.map((cc) => (
              <option key={cc.id} value={cc.code}>
                {cc.code} - {cc.name}
              </option>
            ))}
          </Select>
          <Input
            label="Department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="e.g. Engineering"
          />

          <div className="flex justify-end gap-2 mt-4 pt-3 border-t">
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Invite
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        open={!!editingUserId}
        onClose={() => setEditingUserId(null)}
        title="Edit User Mapping"
      >
        <form onSubmit={handleUpdateSubmit} className="space-y-4">
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            type="email"
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Select
            label="Role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            required
          >
            <option value="HM">Hiring Manager</option>
            <option value="HR_TA">HR / Talent Acquisition</option>
            <option value="Admin">Admin</option>
          </Select>
          <Select
            label="Cost centre"
            value={costCentre}
            onChange={(e) => setCostCentre(e.target.value)}
          >
            <option value="">None</option>
            {costCentres?.map((cc) => (
              <option key={cc.id} value={cc.code}>
                {cc.code} - {cc.name}
              </option>
            ))}
          </Select>
          <Input
            label="Department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="e.g. Engineering"
          />

          <div className="flex justify-end gap-2 mt-4 pt-3 border-t">
            <Button variant="secondary" onClick={() => setEditingUserId(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
