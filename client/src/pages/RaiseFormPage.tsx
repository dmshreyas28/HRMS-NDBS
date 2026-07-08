import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Layout } from "../components/Layout";
import { FormField, inputClass } from "../components/FormField";
import { TagInput } from "../components/TagInput";
import { StatusBadge } from "../components/StatusBadge";
import { usePosition, useUpdateDraft, useSubmitPosition } from "../hooks/usePositions";
import { useTemplatesByCostCentre } from "../hooks/useTemplates";
import { useCostCentres } from "../hooks/useCostCentres";
import { useAuthStore } from "../store/authStore";
import type { MrfTemplate } from "../types/models";

const LOCATIONS = ["Remote", "On-site", "Hybrid"];
const EXPERIENCE_LEVELS = ["Junior", "Mid", "Senior", "Lead"];
const SHIFT_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface FormState {
  mrfTemplateId: string;
  jobTitle: string;
  jobCode: string;
  division: string;
  reportingManager: string;
  jd: string;
  requiredSkills: string[];
  salaryMin: string;
  salaryMax: string;
  requiredStartDate: string;
  location: string;
  experienceLevel: string;
  shiftTime: string;
  shiftDays: string[];
  sittingPlace: string;
  impactIfUnfilled: string;
  // Replacement-only fields
  exEmployeeName: string;
  exEmployeeId: string;
  exEmployeeEmail: string;
  exEmployeePhone: string;
  bu: string;
  department: string;
  lastSalary: string;
  reasonForLeaving: string;
  colourCode: string;
}

function emptyForm(): FormState {
  return {
    mrfTemplateId: "", jobTitle: "", jobCode: "", division: "", reportingManager: "", jd: "",
    requiredSkills: [], salaryMin: "", salaryMax: "", requiredStartDate: "", location: "",
    experienceLevel: "", shiftTime: "", shiftDays: [], sittingPlace: "", impactIfUnfilled: "",
    exEmployeeName: "", exEmployeeId: "", exEmployeeEmail: "", exEmployeePhone: "",
    bu: "", department: "", lastSalary: "", reasonForLeaving: "", colourCode: "",
  };
}

function fromPosition(p: any): FormState {
  const rd = p.replacementDetails ?? {};
  return {
    mrfTemplateId: p.mrfTemplateId ?? "", jobTitle: p.jobTitle ?? "", jobCode: p.jobCode ?? "",
    division: p.division ?? "", reportingManager: p.reportingManager ?? "", jd: p.jd ?? "",
    requiredSkills: p.requiredSkills ?? [], salaryMin: String(p.salaryRange?.min ?? ""),
    salaryMax: String(p.salaryRange?.max ?? ""),
    requiredStartDate: p.requiredStartDate ? p.requiredStartDate.slice(0, 10) : "",
    location: p.location ?? "", experienceLevel: p.experienceLevel ?? "", shiftTime: p.shiftTime ?? "",
    shiftDays: p.shiftDays ?? [], sittingPlace: p.sittingPlace ?? "",
    impactIfUnfilled: p.impactIfUnfilled ?? "",
    exEmployeeName: rd.exEmployeeName ?? "", exEmployeeId: rd.exEmployeeId ?? "",
    exEmployeeEmail: rd.exEmployeeEmail ?? "", exEmployeePhone: rd.exEmployeePhone ?? "",
    bu: rd.bu ?? "", department: rd.department ?? "",
    lastSalary: rd.lastSalary ? String(rd.lastSalary) : "",
    reasonForLeaving: rd.reasonForLeaving ?? "", colourCode: rd.colourCode ?? "",
  };
}

export function RaiseFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const { data: position, isLoading } = usePosition(id);
  const { data: templates } = useTemplatesByCostCentre(user?.costCentre);
  const { data: costCentres } = useCostCentres();

  const updateDraft = useUpdateDraft(id!);
  const submitPosition = useSubmitPosition();

  const [form, setForm] = useState<FormState>(emptyForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [appliedTemplateId, setAppliedTemplateId] = useState<string>("");

  useEffect(() => {
    if (position) {
      setForm(fromPosition(position));
      setAppliedTemplateId(position.mrfTemplateId);
    }
  }, [position]);

  const costCentreName = useMemo(() => {
    const cc = costCentres?.find((c) => c.code === user?.costCentre);
    return cc?.name ?? user?.costCentre ?? "";
  }, [costCentres, user?.costCentre]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const applyTemplate = (template: MrfTemplate | undefined) => {
    if (!template) return;
    setForm((f) => ({
      ...f, mrfTemplateId: template.id, jobTitle: template.jobTitle, jd: template.jdSkeleton,
      requiredSkills: [...template.requiredSkills], salaryMin: String(template.salaryRange.min),
      salaryMax: String(template.salaryRange.max), division: costCentreName,
    }));
    setAppliedTemplateId(template.id);
  };

  const onTemplateSelect = (templateId: string) => {
    if (templateId === "") { set("mrfTemplateId", ""); return; }
    applyTemplate(templates?.find((t) => t.id === templateId));
  };

  const reapplyTemplate = () => {
    applyTemplate(templates?.find((t) => t.id === appliedTemplateId));
  };

  const validate = (strict: boolean): boolean => {
    const e: Record<string, string> = {};
    const req = (k: keyof FormState, label: string) => {
      if (!String(form[k]).trim()) e[k] = `${label} is required.`;
    };
    if (strict) {
      req("mrfTemplateId", "Template");
      req("jobTitle", "Job title");
      req("jobCode", "Job code");
      req("division", "Division");
      req("jd", "Job description");
      if (form.requiredSkills.length === 0) e.requiredSkills = "At least one skill is required.";
      req("requiredStartDate", "Required start date");
      req("location", "Location");
      req("experienceLevel", "Experience level");
      req("shiftTime", "Shift time");
      if (form.shiftDays.length === 0) e.shiftDays = "At least one shift day is required.";
      req("impactIfUnfilled", "Impact if unfilled");
      const min = Number(form.salaryMin);
      const max = Number(form.salaryMax);
      if (!min || !max) e.salaryMin = "Salary range is required.";
      else if (min >= max) e.salaryMin = "Min must be less than max.";
      if (form.requiredStartDate) {
        const d = new Date(form.requiredStartDate);
        if (d.getTime() < Date.now() - 86_400_000) e.requiredStartDate = "Start date must be in the future.";
      }
      if (position?.positionType === "REPLACEMENT") {
        req("exEmployeeName", "Ex-employee name");
        req("exEmployeeId", "Ex-employee ID");
        req("exEmployeeEmail", "Ex-employee email");
        req("exEmployeePhone", "Ex-employee phone number");
        req("bu", "Business unit (BU)");
        req("department", "Department");
        req("lastSalary", "Last salary");
        req("colourCode", "Departure color code");
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const buildUpdateInput = () => ({
    costCentre: user?.costCentre ?? "", division: form.division, jobTitle: form.jobTitle,
    reportingManager: form.reportingManager, jd: form.jd, requiredSkills: form.requiredSkills,
    salaryRange: { min: Number(form.salaryMin) || 0, max: Number(form.salaryMax) || 0, currency: "INR" },
    requiredStartDate: new Date(form.requiredStartDate).toISOString(), shiftTime: form.shiftTime,
    shiftDays: form.shiftDays, location: form.location, experienceLevel: form.experienceLevel,
    impactIfUnfilled: form.impactIfUnfilled, sittingPlace: form.sittingPlace, reviewerId: null,
    ...(position?.positionType === "REPLACEMENT" ? {
      replacementDetails: {
        exEmployeeName: form.exEmployeeName, exEmployeeId: form.exEmployeeId,
        exEmployeeEmail: form.exEmployeeEmail, exEmployeePhone: form.exEmployeePhone,
        bu: form.bu, department: form.department,
        lastSalary: Number(form.lastSalary) || 0,
        reasonForLeaving: form.reasonForLeaving, colourCode: form.colourCode,
      }
    } : {}),
  });

  const handleSaveDraft = () => {
    validate(false);
    updateDraft.mutate(buildUpdateInput(), {
      onSuccess: () => navigate("/raise"),
      onError: (e) => alert(`Save failed: ${(e as Error).message}`),
    });
  };

  const handleSubmit = () => {
    if (!validate(true)) return;
    updateDraft.mutate(buildUpdateInput(), {
      onSuccess: () => {
        submitPosition.mutate(
          { id: id!, input: { reviewerId: null, approvalSkipped: false } },
          {
            onSuccess: () => navigate("/raise"),
            onError: (e) => alert(`Submit failed: ${(e as Error).message}`),
          }
        );
      },
      onError: (e) => alert(`Save failed: ${(e as Error).message}`),
    });
  };

  if (isLoading) {
    return (<Layout><p className="text-gray-500">Loading…</p></Layout>);
  }
  if (!position) {
    return (<Layout><p className="text-gray-500">Position not found.</p></Layout>);
  }

  const isDraft = position.status === "DRAFT";

  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-gray-900">Raise Position</h1>
          <StatusBadge status={position.status} />
        </div>
        <button onClick={() => navigate("/raise")} className="text-sm text-gray-600 hover:underline">← Back</button>
      </div>

      <div className="space-y-8">
        {/* Template */}
        <section className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Template</h2>
          <FormField label="Template" required error={errors.mrfTemplateId}>
            <select value={form.mrfTemplateId} onChange={(e) => onTemplateSelect(e.target.value)} disabled={!isDraft} className={inputClass}>
              <option value="">Select a template…</option>
              {templates?.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}
            </select>
          </FormField>
          {appliedTemplateId && isDraft && (
            <button type="button" onClick={reapplyTemplate} className="mt-2 text-xs text-indigo-600 hover:underline">Re-apply template</button>
          )}
        </section>

        {/* Position Details */}
        <section className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Position Details <span className="text-gray-400">(auto-filled from template, editable)</span>
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Job Title" required error={errors.jobTitle}>
              <input value={form.jobTitle} onChange={(e) => set("jobTitle", e.target.value)} disabled={!isDraft} className={inputClass} />
            </FormField>
            <FormField label="Job Code" required error={errors.jobCode}>
              <input value={form.jobCode} onChange={(e) => set("jobCode", e.target.value)} disabled={!isDraft} className={inputClass} />
            </FormField>
            <FormField label="Division" required error={errors.division}>
              <input value={form.division} onChange={(e) => set("division", e.target.value)} disabled={!isDraft} className={inputClass} />
            </FormField>
            <FormField label="Reporting Manager">
              <input value={form.reportingManager} onChange={(e) => set("reportingManager", e.target.value)} disabled={!isDraft} className={inputClass} />
            </FormField>
            <div className="col-span-2">
              <FormField label="Job Description" required error={errors.jd}>
                <textarea value={form.jd} onChange={(e) => set("jd", e.target.value)} disabled={!isDraft} rows={4} className={inputClass} />
              </FormField>
            </div>
            <div className="col-span-2">
              <FormField label="Required Skills" required error={errors.requiredSkills}>
                <TagInput values={form.requiredSkills} onChange={(v) => set("requiredSkills", v)} placeholder={isDraft ? "Type a skill and press Enter" : undefined} />
              </FormField>
            </div>
            <FormField label="Salary Min (INR)" required error={errors.salaryMin}>
              <input type="number" value={form.salaryMin} onChange={(e) => set("salaryMin", e.target.value)} disabled={!isDraft} className={inputClass} />
            </FormField>
            <FormField label="Salary Max (INR)">
              <input type="number" value={form.salaryMax} onChange={(e) => set("salaryMax", e.target.value)} disabled={!isDraft} className={inputClass} />
            </FormField>
          </div>
        </section>

        {/* Replacement Details (only for REPLACEMENT positions) */}
        {position?.positionType === "REPLACEMENT" && (
          <section className="rounded-lg border border-rose-200 bg-rose-50/30 p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-rose-700">
              Replacement Personnel Details
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Ex-Employee Name" required error={errors.exEmployeeName}>
                <input value={form.exEmployeeName} onChange={(e) => set("exEmployeeName", e.target.value)} disabled={!isDraft} className={inputClass} />
              </FormField>
              <FormField label="Ex-Employee ID" required error={errors.exEmployeeId}>
                <input value={form.exEmployeeId} onChange={(e) => set("exEmployeeId", e.target.value)} disabled={!isDraft} className={inputClass} />
              </FormField>
              <FormField label="Ex-Employee Email" required error={errors.exEmployeeEmail}>
                <input value={form.exEmployeeEmail} onChange={(e) => set("exEmployeeEmail", e.target.value)} disabled={!isDraft} className={inputClass} />
              </FormField>
              <FormField label="Ex-Employee Phone" required error={errors.exEmployeePhone}>
                <input value={form.exEmployeePhone} onChange={(e) => set("exEmployeePhone", e.target.value)} disabled={!isDraft} className={inputClass} />
              </FormField>
              <FormField label="Business Unit (BU)" required error={errors.bu}>
                <input value={form.bu} onChange={(e) => set("bu", e.target.value)} disabled={!isDraft} className={inputClass} />
              </FormField>
              <FormField label="Department" required error={errors.department}>
                <input value={form.department} onChange={(e) => set("department", e.target.value)} disabled={!isDraft} className={inputClass} />
              </FormField>
              <FormField label="Last Salary (INR)" required error={errors.lastSalary}>
                <input type="number" value={form.lastSalary} onChange={(e) => set("lastSalary", e.target.value)} disabled={!isDraft} className={inputClass} />
              </FormField>
              <FormField label="Colour Code" required error={errors.colourCode}>
                <select value={form.colourCode} onChange={(e) => set("colourCode", e.target.value)} disabled={!isDraft} className={inputClass}>
                  <option value="">Select…</option>
                  <option value="GREEN">GREEN — Voluntary / Good Standing</option>
                  <option value="RED">RED — Performance</option>
                  <option value="BLACK">BLACK — Misconduct / Involuntary</option>
                </select>
              </FormField>
              <div className="col-span-2">
                <FormField label="Reason for Leaving">
                  <textarea value={form.reasonForLeaving} onChange={(e) => set("reasonForLeaving", e.target.value)} disabled={!isDraft} rows={2} className={inputClass} />
                </FormField>
              </div>
            </div>
          </section>
        )}

        {/* Supplementary Details */}
        <section className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Supplementary Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Required Start Date" required error={errors.requiredStartDate}>
              <input type="date" value={form.requiredStartDate} onChange={(e) => set("requiredStartDate", e.target.value)} disabled={!isDraft} className={inputClass} />
            </FormField>
            <FormField label="Location" required error={errors.location}>
              <select value={form.location} onChange={(e) => set("location", e.target.value)} disabled={!isDraft} className={inputClass}>
                <option value="">Select…</option>
                {LOCATIONS.map((l) => (<option key={l} value={l}>{l}</option>))}
              </select>
            </FormField>
            <FormField label="Experience Level" required error={errors.experienceLevel}>
              <select value={form.experienceLevel} onChange={(e) => set("experienceLevel", e.target.value)} disabled={!isDraft} className={inputClass}>
                <option value="">Select…</option>
                {EXPERIENCE_LEVELS.map((l) => (<option key={l} value={l}>{l}</option>))}
              </select>
            </FormField>
            <FormField label="Shift Time" required error={errors.shiftTime}>
              <input value={form.shiftTime} onChange={(e) => set("shiftTime", e.target.value)} disabled={!isDraft} placeholder="e.g. 09:00-18:00" className={inputClass} />
            </FormField>
            <div className="col-span-2">
              <FormField label="Shift Days" required error={errors.shiftDays}>
                <div className="flex flex-wrap gap-2">
                  {SHIFT_DAYS.map((d) => {
                    const active = form.shiftDays.includes(d);
                    return (
                      <button key={d} type="button" disabled={!isDraft}
                        onClick={() => set("shiftDays", active ? form.shiftDays.filter((x) => x !== d) : [...form.shiftDays, d])}
                        className={`rounded-full border px-3 py-1 text-sm ${active ? "border-indigo-600 bg-indigo-600 text-white" : "border-gray-300 text-gray-700 hover:bg-gray-100"} ${!isDraft ? "opacity-60" : ""}`}
                      >{d}</button>
                    );
                  })}
                </div>
              </FormField>
            </div>
            <FormField label="Sitting Place">
              <input value={form.sittingPlace} onChange={(e) => set("sittingPlace", e.target.value)} disabled={!isDraft} placeholder="e.g. Bay-12, Floor 3" className={inputClass} />
            </FormField>
            <div className="col-span-2">
              <FormField label="Impact if Unfilled" required error={errors.impactIfUnfilled}>
                <textarea value={form.impactIfUnfilled} onChange={(e) => set("impactIfUnfilled", e.target.value)} disabled={!isDraft} rows={3} className={inputClass} />
              </FormField>
            </div>
          </div>
        </section>

        {isDraft && (
          <div className="flex justify-end gap-3">
            <button onClick={handleSaveDraft} disabled={updateDraft.isPending}
              className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50">
              {updateDraft.isPending ? "Saving…" : "Save Draft"}
            </button>
            <button onClick={handleSubmit} disabled={updateDraft.isPending || submitPosition.isPending}
              className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
              {submitPosition.isPending ? "Submitting…" : "Submit for Approval"}
            </button>
          </div>
        )}

        {!isDraft && (
          <p className="text-center text-sm text-gray-500">This position has been submitted and is no longer editable.</p>
        )}
      </div>
    </Layout>
  );
}
