import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "../../components/Layout";
import { api } from "../../api/client";
import { useCostCentres } from "../../hooks/useCostCentres";
import { TagInput } from "../../components/TagInput";

export function AdminTemplatesPage() {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);

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
    },
    onError: (e) => alert(`Failed to create template: ${(e as Error).message}`),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put<any>(`/api/mrf-templates/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-templates"] });
      setEditingTemplate(null);
      resetForm();
    },
    onError: (e) => alert(`Failed to update template: ${(e as Error).message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete<void>(`/api/mrf-templates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-templates"] });
    },
    onError: (e) => alert(`Failed to deactivate template: ${(e as Error).message}`),
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
      <div className="mb-6 flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">MRF Template Management</h1>
          <p className="text-sm text-slate-500 mt-1">Configure preset requisition details for HMs.</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 shadow-md"
        >
          Add Template
        </button>
      </div>

      {isLoading ? (
        <p className="text-slate-500 py-8 text-center">Loading templates catalog…</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {templates?.map((t) => (
            <div key={t.id} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-bold text-slate-400">{t.costCentre}</span>
                  <span className={`rounded-full h-2.5 w-2.5 inline-block ${t.isActive ? "bg-emerald-500" : "bg-slate-300"}`} />
                </div>
                <h3 className="text-lg font-bold text-slate-800">{t.name}</h3>
                <p className="text-xs text-slate-500 mt-1">Title: {t.jobTitle}</p>
                <div className="mt-4 flex flex-wrap gap-1">
                  {t.requiredSkills?.map((s: string) => (
                    <span key={s} className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600 font-medium">{s}</span>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-3 font-semibold">Budget: ₹{t.salaryRange?.min?.toLocaleString()} - ₹{t.salaryRange?.max?.toLocaleString()}</p>
              </div>

              <div className="mt-6 border-t pt-4 flex gap-3 justify-end text-xs font-bold">
                <button onClick={() => handleEditClick(t)} className="text-indigo-600 hover:underline">Edit</button>
                {t.isActive && (
                  <button onClick={() => deleteMutation.mutate(t.id)} className="text-rose-600 hover:underline">Deactivate</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modals */}
      {(showAddModal || editingTemplate) && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={showAddModal ? handleCreateSubmit : handleUpdateSubmit} className="w-full max-w-lg bg-white rounded-xl shadow-xl p-6 border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900">{showAddModal ? "Create Template" : "Edit Template"}</h3>

            <div className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Template Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Software Engineer" className="w-full rounded border p-2 text-sm" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Cost Centre</label>
                  <select value={costCentre} onChange={(e) => setCostCentre(e.target.value)} className="w-full rounded border p-2 text-sm" required>
                    <option value="">Select Cost Centre</option>
                    {costCentres?.map((cc) => (
                      <option key={cc.id} value={cc.code}>{cc.code} - {cc.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Job Title</label>
                  <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className="w-full rounded border p-2 text-sm" required />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">JD Skeleton / Details</label>
                <textarea value={jdSkeleton} onChange={(e) => setJdSkeleton(e.target.value)} rows={4} className="w-full rounded border p-2 text-sm" required />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Required Skills</label>
                <TagInput values={requiredSkills} onChange={setRequiredSkills} placeholder="Add a skill..." />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Min Salary (Annual INR)</label>
                  <input type="number" value={minSalary} onChange={(e) => setMinSalary(e.target.value)} className="w-full rounded border p-2 text-sm" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Max Salary (Annual INR)</label>
                  <input type="number" value={maxSalary} onChange={(e) => setMaxSalary(e.target.value)} className="w-full rounded border p-2 text-sm" required />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingTemplate(null);
                }}
                className="rounded-lg border px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 shadow-md">
                Save Template
              </button>
            </div>
          </form>
        </div>
      )}
    </Layout>
  );
}
