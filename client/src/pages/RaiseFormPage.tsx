import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "../components/Layout";
import { StatusBadge } from "../components/StatusBadge";
import { usePosition, useUpdateDraft, useSubmitPosition } from "../hooks/usePositions";
import { useTemplatesByCostCentre } from "../hooks/useTemplates";
import { listDoa } from "../api/doa";
import { useAuthStore } from "../store/authStore";
import { PageHeader, Card, Spinner, Button, Input, Textarea, Select } from '../components/ui';

export function RaiseFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const { data: position, isLoading } = usePosition(id);
  const { data: templates } = useTemplatesByCostCentre(user?.costCentre);
  const { data: doa } = useQuery({
    queryKey: ["doa"],
    queryFn: listDoa,
  });

  const updateDraft = useUpdateDraft(id!);
  const submitPosition = useSubmitPosition();

  type FormState = {
    mrfTemplateId: string; jobTitle: string; jobCode: string; division: string;
    reportingManager: string; jd: string; requiredSkills: string[];
    salaryRange: { min: number; max: number; currency: string };
    requiredStartDate: string; location: string; experienceLevel: string;
    shiftTime: string; shiftDays: string[]; sittingPlace: string; impactIfUnfilled: string;
    approvalSkipped: boolean; approvalSkippedReason: string; reviewerId: string;
    replacementDetails?: {
      exEmployeeName: string; exEmployeeId: string; exEmployeeEmail: string;
      exEmployeePhone: string; bu: string; department: string;
      lastSalary: number; reasonForLeaving: string; colourCode: string;
    };
  };
  const formInitialised = useRef(false);
  const [form, setForm] = useState<FormState>({
    mrfTemplateId: "",
    jobTitle: "",
    jobCode: "",
    division: "",
    reportingManager: "",
    jd: "",
    requiredSkills: [],
    salaryRange: { min: 0, max: 0, currency: "INR" },
    requiredStartDate: "",
    location: "",
    experienceLevel: "",
    shiftTime: "",
    shiftDays: [],
    sittingPlace: "",
    impactIfUnfilled: "",
    approvalSkipped: false,
    approvalSkippedReason: "",
    reviewerId: "",
    replacementDetails: undefined,
  });

  useEffect(() => {
    if (position && !formInitialised.current) {
      formInitialised.current = true;
      const rd = position.replacementDetails;
      setForm({
        mrfTemplateId: position.mrfTemplateId ?? "",
        jobTitle: position.jobTitle ?? "",
        jobCode: position.jobCode ?? "",
        division: position.division ?? "",
        reportingManager: position.reportingManager ?? "",
        jd: position.jd ?? "",
        requiredSkills: position.requiredSkills ?? [],
        salaryRange: {
          min: position.salaryRange?.min ?? 0,
          max: position.salaryRange?.max ?? 0,
          currency: position.salaryRange?.currency ?? "INR",
        },
        requiredStartDate: position.requiredStartDate ? position.requiredStartDate.substring(0, 10) : "",
        location: position.location ?? "",
        experienceLevel: position.experienceLevel ?? "",
        shiftTime: position.shiftTime ?? "",
        shiftDays: position.shiftDays ?? [],
        sittingPlace: position.sittingPlace ?? "",
        impactIfUnfilled: position.impactIfUnfilled ?? "",
        approvalSkipped: position.approvalSkipped ?? false,
        approvalSkippedReason: position.approvalSkippedReason ?? "",
        reviewerId: position.reviewerId ?? "",
        replacementDetails: position.positionType === "REPLACEMENT" && rd ? {
          exEmployeeName: rd.exEmployeeName ?? "",
          exEmployeeId: rd.exEmployeeId ?? "",
          exEmployeeEmail: rd.exEmployeeEmail ?? "",
          exEmployeePhone: rd.exEmployeePhone ?? "",
          bu: rd.bu ?? "",
          department: rd.department ?? "",
          lastSalary: rd.lastSalary ?? 0,
          reasonForLeaving: rd.reasonForLeaving ?? "",
          colourCode: rd.colourCode ?? "GREEN",
        } : undefined,
      });
    }
  }, [position]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
  };

  const setReplacementDetail = <K extends keyof NonNullable<FormState["replacementDetails"]>>(
    key: K,
    value: NonNullable<FormState["replacementDetails"]>[K]
  ) => {
    setForm((f) => {
      const rd = f.replacementDetails || {
        exEmployeeName: "",
        exEmployeeId: "",
        exEmployeeEmail: "",
        exEmployeePhone: "",
        bu: "",
        department: "",
        lastSalary: 0,
        reasonForLeaving: "",
        colourCode: "GREEN",
      };
      return {
        ...f,
        replacementDetails: {
          ...rd,
          [key]: value,
        },
      };
    });
  };

  const applyTemplate = (templateId: string) => {
    set("mrfTemplateId", templateId);
    const tpl = templates?.find((t) => t.id === templateId);
    if (!tpl) return;
    setForm((f) => ({
      ...f,
      mrfTemplateId: templateId,
      jobTitle: tpl.jobTitle,
      jd: tpl.jdSkeleton,
      requiredSkills: tpl.requiredSkills,
      salaryRange: { ...tpl.salaryRange, currency: "INR" },
      division: tpl.costCentre,
    }));
  };

  const save = async (submit: boolean) => {
    if (form.approvalSkipped && !form.approvalSkippedReason) {
      alert("Please provide a reason for skipping approval");
      return;
    }
    if (!form.approvalSkipped && submit && !form.reviewerId) {
      alert("Please select a reviewer, or mark approval as not required");
      return;
    }

    const payload = {
      costCentre: user?.costCentre ?? "",
      division: form.division,
      jobTitle: form.jobTitle,
      reportingManager: form.reportingManager,
      jd: form.jd,
      requiredSkills: form.requiredSkills,
      salaryRange: {
        min: Number(form.salaryRange.min) || 0,
        max: Number(form.salaryRange.max) || 0,
        currency: form.salaryRange.currency || "INR",
      },
      requiredStartDate: form.requiredStartDate ? new Date(form.requiredStartDate).toISOString() : new Date().toISOString(),
      shiftTime: form.shiftTime,
      shiftDays: form.shiftDays,
      location: form.location,
      experienceLevel: form.experienceLevel,
      impactIfUnfilled: form.impactIfUnfilled,
      sittingPlace: form.sittingPlace,
      reviewerId: form.approvalSkipped ? null : form.reviewerId || null,
      mrfTemplateId: form.mrfTemplateId,
      ...(position?.positionType === "REPLACEMENT" ? {
        replacementDetails: {
          exEmployeeName: form.replacementDetails?.exEmployeeName ?? "",
          exEmployeeId: form.replacementDetails?.exEmployeeId ?? "",
          exEmployeeEmail: form.replacementDetails?.exEmployeeEmail ?? "",
          exEmployeePhone: form.replacementDetails?.exEmployeePhone ?? "",
          bu: form.replacementDetails?.bu ?? "",
          department: form.replacementDetails?.department ?? "",
          lastSalary: Number(form.replacementDetails?.lastSalary) || 0,
          reasonForLeaving: form.replacementDetails?.reasonForLeaving ?? "",
          colourCode: form.replacementDetails?.colourCode ?? "GREEN",
        }
      } : {}),
    };

    updateDraft.mutate(payload, {
      onSuccess: () => {
        if (submit) {
          submitPosition.mutate(
            {
              id: id!,
              input: {
                reviewerId: form.approvalSkipped ? null : form.reviewerId || null,
                approvalSkipped: form.approvalSkipped,
                approvalSkippedReason: form.approvalSkipped ? form.approvalSkippedReason : null,
              },
            },
            {
              onSuccess: () => {
                alert("MRF submitted for approval");
                navigate("/raise");
              },
              onError: (e) => alert(`Submit failed: ${(e as Error).message}`),
            }
          );
        } else {
          alert("Draft saved successfully");
          navigate("/raise");
        }
      },
      onError: (e) => alert(`Save failed: ${(e as Error).message}`),
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center py-12"><Spinner /></div>
      </Layout>
    );
  }

  if (!position) {
    return (
      <Layout>
        <div className="p-8 text-center text-slate-500">Position not found.</div>
      </Layout>
    );
  }

  const isDraft = position.status === "DRAFT";

  return (
    <Layout>
      <PageHeader
        title="Raise Requisition"
        subtitle={
          position.positionType === "REPLACEMENT"
            ? `Replacement for ${position.replacementDetails?.exEmployeeName || "Direct Report"}`
            : "Request new headcount approval"
        }
        actions={
          <div className="flex items-center gap-3">
            <StatusBadge status={position.status} />
            <Button variant="secondary" onClick={() => navigate("/raise")}>
              ← Back
            </Button>
          </div>
        }
      />

      <div className="space-y-6 max-w-4xl">
        {/* Template selection */}
        <Card className="p-5">
          <h3 className="font-semibold text-slate-900 mb-3">1. MRF Template</h3>
          <Select
            value={form.mrfTemplateId ?? ""}
            onChange={(e) => applyTemplate(e.target.value)}
            disabled={!isDraft}
            label="Template"
          >
            <option value="">— Choose a template (auto-fills fields) —</option>
            {templates?.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} · {t.costCentre}
              </option>
            ))}
          </Select>
        </Card>

        {/* Core fields */}
        <Card className="p-5">
          <h3 className="font-semibold text-slate-900 mb-3">2. Position details</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="Job title *"
              value={form.jobTitle ?? ""}
              onChange={(e) => set("jobTitle", e.target.value)}
              disabled={!isDraft}
            />
            <Input
              label="Cost centre"
              value={form.division ?? ""}
              onChange={(e) => set("division", e.target.value)}
              disabled={!isDraft}
            />
            <Input
              label="Job code"
              value={form.jobCode ?? ""}
              onChange={(e) => set("jobCode", e.target.value)}
              disabled={!isDraft}
            />
            <Input
              label="Division"
              value={form.division ?? ""}
              onChange={(e) => set("division", e.target.value)}
              disabled={!isDraft}
            />
            <Input
              label="Reporting manager"
              value={form.reportingManager ?? ""}
              onChange={(e) => set("reportingManager", e.target.value)}
              disabled={!isDraft}
            />
            <Input
              label="Location / site"
              value={form.location ?? ""}
              onChange={(e) => set("location", e.target.value)}
              disabled={!isDraft}
            />
          </div>
          <div className="mt-4">
            <Textarea
              label="Detailed JD"
              rows={4}
              value={form.jd ?? ""}
              onChange={(e) => set("jd", e.target.value)}
              disabled={!isDraft}
            />
          </div>
          <div className="mt-4 grid md:grid-cols-2 gap-4">
            <Input
              label="Required skills (comma-separated)"
              value={(form.requiredSkills ?? []).join(", ")}
              onChange={(e) =>
                set(
                  "requiredSkills",
                  e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)
                )
              }
              disabled={!isDraft}
            />
            <Input
              label="Experience level"
              value={form.experienceLevel ?? ""}
              onChange={(e) => set("experienceLevel", e.target.value)}
              disabled={!isDraft}
            />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4">
            <Input
              label="Salary min"
              type="number"
              value={form.salaryRange?.min ?? 0}
              onChange={(e) =>
                set("salaryRange", { ...form.salaryRange, min: +e.target.value })
              }
              disabled={!isDraft}
            />
            <Input
              label="Salary max"
              type="number"
              value={form.salaryRange?.max ?? 0}
              onChange={(e) =>
                set("salaryRange", { ...form.salaryRange, max: +e.target.value })
              }
              disabled={!isDraft}
            />
            <Input
              label="Currency"
              value={form.salaryRange?.currency ?? "INR"}
              onChange={(e) =>
                set("salaryRange", { ...form.salaryRange, currency: e.target.value })
              }
              disabled={!isDraft}
            />
          </div>
        </Card>

        {/* Supplementary */}
        <Card className="p-5">
          <h3 className="font-semibold text-slate-900 mb-3">3. Supplementary details</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="Required start date"
              type="date"
              value={form.requiredStartDate ?? ""}
              onChange={(e) => set("requiredStartDate", e.target.value)}
              disabled={!isDraft}
            />
            <Input
              label="Shift time"
              value={form.shiftTime ?? ""}
              onChange={(e) => set("shiftTime", e.target.value)}
              disabled={!isDraft}
            />
            <Input
              label="Shift days (comma-separated, e.g. Mon,Tue,Wed)"
              value={(form.shiftDays ?? []).join(",")}
              onChange={(e) =>
                set(
                  "shiftDays",
                  e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)
                )
              }
              disabled={!isDraft}
            />
            <Input
              label="Identified sitting place (optional)"
              value={form.sittingPlace ?? ""}
              onChange={(e) => set("sittingPlace", e.target.value)}
              disabled={!isDraft}
            />
          </div>
          <div className="mt-4">
            <Textarea
              label="Impact on team if not filled"
              rows={2}
              value={form.impactIfUnfilled ?? ""}
              onChange={(e) => set("impactIfUnfilled", e.target.value)}
              disabled={!isDraft}
            />
          </div>
        </Card>

        {/* Replacement details */}
        {position.positionType === "REPLACEMENT" && (
          <Card className="p-5">
            <h3 className="font-semibold text-slate-900 mb-3">
              4. Ex-employee details (replacement)
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="Ex-employee name"
                value={form.replacementDetails?.exEmployeeName ?? ""}
                onChange={(e) => setReplacementDetail("exEmployeeName", e.target.value)}
                disabled={!isDraft}
              />
              <Input
                label="Ex-employee ID"
                value={form.replacementDetails?.exEmployeeId ?? ""}
                onChange={(e) => setReplacementDetail("exEmployeeId", e.target.value)}
                disabled={!isDraft}
              />
              <Input
                label="Email"
                value={form.replacementDetails?.exEmployeeEmail ?? ""}
                onChange={(e) => setReplacementDetail("exEmployeeEmail", e.target.value)}
                disabled={!isDraft}
              />
              <Input
                label="Phone"
                value={form.replacementDetails?.exEmployeePhone ?? ""}
                onChange={(e) => setReplacementDetail("exEmployeePhone", e.target.value)}
                disabled={!isDraft}
              />
              <Input
                label="Business unit"
                value={form.replacementDetails?.bu ?? ""}
                onChange={(e) => setReplacementDetail("bu", e.target.value)}
                disabled={!isDraft}
              />
              <Input
                label="Department"
                value={form.replacementDetails?.department ?? ""}
                onChange={(e) => setReplacementDetail("department", e.target.value)}
                disabled={!isDraft}
              />
              <Input
                label="Last salary"
                type="number"
                value={form.replacementDetails?.lastSalary ?? 0}
                onChange={(e) => setReplacementDetail("lastSalary", +e.target.value)}
                disabled={!isDraft}
              />
              <Select
                label="Colour code (departure reason)"
                value={form.replacementDetails?.colourCode ?? "GREEN"}
                onChange={(e) => setReplacementDetail("colourCode", e.target.value)}
                disabled={!isDraft}
              >
                <option value="GREEN">GREEN — Voluntary / Good Standing</option>
                <option value="RED">RED — Performance</option>
                <option value="BLACK">BLACK — Misconduct / Involuntary</option>
              </Select>
            </div>
            <div className="mt-4">
              <Textarea
                label="Reason for leaving"
                rows={2}
                value={form.replacementDetails?.reasonForLeaving ?? ""}
                onChange={(e) => setReplacementDetail("reasonForLeaving", e.target.value)}
                disabled={!isDraft}
              />
            </div>
          </Card>
        )}

        {/* Approval routing */}
        <Card className="p-5">
          <h3 className="font-semibold text-slate-900 mb-3">
            {position.positionType === "REPLACEMENT" ? "5" : "4"}. Approval routing
          </h3>
          <label className="flex items-center gap-2 mb-3 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={!!form.approvalSkipped}
              onChange={(e) => set("approvalSkipped", e.target.checked)}
              disabled={!isDraft}
              className="rounded border-slate-350 text-brand-600 focus:ring-brand-500"
            />
            Approval not required (skip — log with reason)
          </label>
          {form.approvalSkipped ? (
            <Textarea
              label="Reason for skipping approval"
              rows={2}
              value={form.approvalSkippedReason ?? ""}
              onChange={(e) => set("approvalSkippedReason", e.target.value)}
              disabled={!isDraft}
            />
          ) : (
            <Select
              label="Reviewer (Delegation of Authority)"
              value={form.reviewerId ?? ""}
              onChange={(e) => set("reviewerId", e.target.value)}
              disabled={!isDraft}
            >
              <option value="">— Select reviewer —</option>
              {doa?.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} — {d.title}
                </option>
              ))}
            </Select>
          )}
        </Card>

        {isDraft ? (
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => save(false)}>
              Save as draft
            </Button>
            <Button variant="primary" onClick={() => save(true)}>
              Submit for approval
            </Button>
          </div>
        ) : (
          <p className="text-center text-sm text-slate-500 font-medium py-4">
            This position has been submitted and is no longer editable.
          </p>
        )}
      </div>
    </Layout>
  );
}
