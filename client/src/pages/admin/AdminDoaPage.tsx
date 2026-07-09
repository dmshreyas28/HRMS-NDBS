import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "../../components/Layout";
import { listDoa, createDoa, updateDoa } from "../../api/doa";
import { PageHeader, Card, Spinner, EmptyState, Button, Modal, Input } from '../../components/ui';

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
      alert("Approver added successfully.");
    },
    onError: (e) => alert(`Failed to add approver: ${(e as Error).message}`),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateDoa(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doa"] });
      setEditingEntry(null);
      resetForm();
      alert("Approver updated successfully.");
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
      <PageHeader
        title="Delegation of Authority"
        subtitle="Approvers available in the MRF reviewer dropdown"
        actions={
          <Button
            variant="primary"
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
          >
            Add approver
          </Button>
        }
      />

      <Card>
        {isLoading ? (
          <Spinner />
        ) : !entries?.length ? (
          <EmptyState title="No approvers" hint="Add your first reviewer." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="text-left px-4 py-3">Name</th>
                  <th className="text-left px-4 py-3">Title</th>
                  <th className="text-left px-4 py-3">Email</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {entries.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{d.name}</td>
                    <td className="px-4 py-3 text-slate-655">{d.title}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{d.email}</td>
                    <td className="px-4 py-3 text-slate-600">
                      <span className={`h-2 w-2 rounded-full inline-block ${d.isActive ? "bg-emerald-500" : "bg-slate-300"}`} />
                      <span className="ml-1.5 text-xs">{d.isActive ? "Active" : "Inactive"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" onClick={() => handleEditClick(d)}>
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add / Edit Modal */}
      <Modal
        open={showAddModal || !!editingEntry}
        onClose={() => {
          setShowAddModal(false);
          setEditingEntry(null);
        }}
        title={showAddModal ? "Add approver" : "Edit approver"}
      >
        <form onSubmit={showAddModal ? handleCreateSubmit : handleUpdateSubmit} className="space-y-4">
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <Input
            type="email"
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border-slate-350 text-brand-600 focus:ring-brand-500"
            />
            <label htmlFor="isActive" className="text-sm font-semibold text-slate-600">
              Active status (available for approval selection)
            </label>
          </div>

          <div className="flex justify-end gap-2 mt-4 pt-3 border-t">
            <Button
              variant="secondary"
              onClick={() => {
                setShowAddModal(false);
                setEditingEntry(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {showAddModal ? "Add" : "Save"}
            </Button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
