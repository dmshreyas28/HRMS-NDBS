import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "../../components/Layout";
import { api } from "../../api/client";
import { PageHeader, Card, Spinner, EmptyState, Button, Modal, Input } from '../../components/ui';

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
      alert("Cost centre created successfully.");
    },
    onError: (e) => alert(`Failed to create cost centre: ${(e as Error).message}`),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put<any>(`/api/cost-centres/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cost-centres"] });
      setEditingCc(null);
      resetForm();
      alert("Cost centre updated successfully.");
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
      <PageHeader
        title="Cost Centres"
        subtitle="Organisational units used to filter MRF templates"
        actions={
          <Button
            variant="primary"
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
          >
            Add cost centre
          </Button>
        }
      />

      <Card>
        {isLoading ? (
          <Spinner />
        ) : !costCentres?.length ? (
          <EmptyState title="No cost centres" hint="Add your first cost centre division." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="text-left px-4 py-3">Code</th>
                  <th className="text-left px-4 py-3">Name</th>
                  <th className="text-left px-4 py-3">Department</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {costCentres.map((cc) => (
                  <tr key={cc.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-bold text-xs text-slate-800">{cc.code}</td>
                    <td className="px-4 py-3 font-medium text-slate-700">{cc.name}</td>
                    <td className="px-4 py-3 text-slate-600">{cc.department}</td>
                    <td className="px-4 py-3 text-slate-600">
                      <span className={`h-2 w-2 rounded-full inline-block ${cc.isActive ? "bg-emerald-500" : "bg-slate-300"}`} />
                      <span className="ml-1.5 text-xs">{cc.isActive ? "Active" : "Inactive"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" onClick={() => handleEditClick(cc)}>
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
        open={showAddModal || !!editingCc}
        onClose={() => {
          setShowAddModal(false);
          setEditingCc(null);
        }}
        title={showAddModal ? "Add cost centre" : "Edit cost centre"}
      >
        <form onSubmit={showAddModal ? handleCreateSubmit : handleUpdateSubmit} className="space-y-4">
          <Input
            label="Code (e.g. CC-006)"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="Department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
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
              Active status (available for new templates)
            </label>
          </div>

          <div className="flex justify-end gap-2 mt-4 pt-3 border-t">
            <Button
              variant="secondary"
              onClick={() => {
                setShowAddModal(false);
                setEditingCc(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {showAddModal ? "Create" : "Save"}
            </Button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
