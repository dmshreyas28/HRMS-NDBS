import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "../../components/Layout";
import { api } from "../../api/client";
import { useCostCentres } from "../../hooks/useCostCentres";
import { TagInput } from "../../components/TagInput";
import { PageHeader, Card, Spinner, EmptyState, Button, Modal, Input, Select, Textarea } from '../../components/ui';

export function AdminTemplatesPage() {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Form State
  const [costCentre, setCostCentre] = useState("");
  const [name, setName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jdSkeleton, setJdSkeleton] = useState("");
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [minSalary, setMinSalary] = useState("600000");
  const [maxSalary, setMaxSalary] = useState("1200000");

  const { data: costCentres } = useCostCentres();

  const { data: templates, isLoading } = useQuery({
    queryKey: ["admin-templates"],
    queryFn: () => api.get<any[]>("/api/mrf-templates"),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post<any>("/api/mrf-templates", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-templates"] });
      setShowAddModal(false);
      resetForm();
      alert("Template created successfully.");
    },
    onError: (e) => alert(`Failed to create template: ${(e as Error).message}`),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put<any>(`/api/mrf-templates/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-templates"] });
      setEditingTemplate(null);
      resetForm();
      alert("Template updated successfully.");
    },
    onError: (e) => alert(`Failed to update template: ${(e as Error).message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete<void>(`/api/mrf-templates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-templates"] });
      alert("Template deleted successfully.");
    },
    onError: (e) => alert(`Failed to delete template: ${(e as Error).message}`),
  });

  const resetForm = () => {
    setCostCentre("");
    setName("");
    setJobTitle("");
    setJdSkeleton("");
    setRequiredSkills([]);
    setMinSalary("600000");
    setMaxSalary("1200000");
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      costCentre,
      name,
      jobTitle,
      jdSkeleton,
      requiredSkills,
      minSalary: Number(minSalary),
      maxSalary: Number(maxSalary),
      isActive: true,
    });
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate) return;
    updateMutation.mutate({
      id: editingTemplate.id,
      data: {
        costCentre,
        name,
        jobTitle,
        jdSkeleton,
        requiredSkills,
        minSalary: Number(minSalary),
        maxSalary: Number(maxSalary),
        isActive: true,
      },
    });
  };

  const handleEditClick = (t: any) => {
    setEditingTemplate(t);
    setCostCentre(t.costCentre);
    setName(t.name);
    setJobTitle(t.jobTitle);
    setJdSkeleton(t.jdSkeleton);
    setRequiredSkills(t.requiredSkills || []);
    setMinSalary(String(t.salaryRange?.min || ""));
    setMaxSalary(String(t.salaryRange?.max || ""));
  };

  return (
    <Layout>
      <PageHeader
        title="MRF Templates"
        subtitle="Cost-centre-specific templates that pre-fill MRF forms"
        actions={
          <Button
            variant="primary"
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
          >
            New template
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : !templates?.length ? (
        <EmptyState title="No templates" hint="Configure your first headcount presets template." />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="text-left px-4 py-3">Name</th>
                  <th className="text-left px-4 py-3">Job Title</th>
                  <th className="text-left px-4 py-3">Cost Centre</th>
                  <th className="text-left px-4 py-3">Salary Band</th>
                  <th className="text-left px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {templates.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{t.name}</td>
                    <td className="px-4 py-3 text-slate-600">{t.jobTitle}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{t.costCentre}</td>
                    <td className="px-4 py-3 text-slate-600">
                      ₹{t.salaryRange?.min?.toLocaleString()} – ₹{t.salaryRange?.max?.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 flex gap-2">
                      <Button variant="ghost" onClick={() => handleEditClick(t)}>
                        Edit
                      </Button>
                      {t.isActive && (
                        <Button
                          variant="ghost"
                          onClick={() => setConfirmDeleteId(t.id)}
                        >
                          Delete
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add / Edit Modals */}
      <Modal
        open={showAddModal || !!editingTemplate}
        onClose={() => {
          setShowAddModal(false);
          setEditingTemplate(null);
        }}
        title={showAddModal ? "New template" : "Edit template"}
        size="lg"
      >
        <form onSubmit={showAddModal ? handleCreateSubmit : handleUpdateSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-3">
            <Input
              label="Template name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Select
              label="Cost centre"
              value={costCentre}
              onChange={(e) => setCostCentre(e.target.value)}
              required
            >
              <option value="">Select Cost Centre</option>
              {costCentres?.map((cc) => (
                <option key={cc.id} value={cc.code}>
                  {cc.code} - {cc.name}
                </option>
              ))}
            </Select>
          </div>
          <Input
            label="Job title"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            required
          />
          <Textarea
            label="JD skeleton"
            value={jdSkeleton}
            onChange={(e) => setJdSkeleton(e.target.value)}
            rows={4}
            required
          />
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Required skills</label>
            <TagInput values={requiredSkills} onChange={setRequiredSkills} placeholder="Add a skill..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Salary min"
              type="number"
              value={minSalary}
              onChange={(e) => setMinSalary(e.target.value)}
              required
            />
            <Input
              label="Salary max"
              type="number"
              value={maxSalary}
              onChange={(e) => setMaxSalary(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-2 mt-4 pt-3 border-t">
            <Button
              variant="secondary"
              onClick={() => {
                setShowAddModal(false);
                setEditingTemplate(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {showAddModal ? "Create" : "Update"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        title="Delete MRF Template"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Are you sure you want to delete this template? This action cannot be undone.</p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
            <Button
              variant="danger"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (confirmDeleteId) {
                  deleteMutation.mutate(confirmDeleteId, {
                    onSuccess: () => setConfirmDeleteId(null),
                    onError: () => setConfirmDeleteId(null),
                  });
                }
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
