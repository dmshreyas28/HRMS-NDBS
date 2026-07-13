import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '../components/Layout';
import { PageHeader, Card, Button, Spinner, Input, Select, Textarea } from '../components/ui';
import { TagInput } from '../components/TagInput';
import { StatusBadge } from '../components/StatusBadge';
import { useAuthStore } from '../store/authStore';
import { getPosition, updatePosition, type UpdatePositionInput } from '../api/positions';
import { listDoa } from '../api/doa';

export function PositionEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const user = useAuthStore(s => s.user);
  const role = user?.role ?? 'HM';

  const { data: position, isLoading } = useQuery({
    queryKey: ['position', id],
    queryFn: () => getPosition(id!),
    enabled: !!id,
  });

  const { data: doaList } = useQuery({ queryKey: ['doa'], queryFn: listDoa });
  const formInitialised = useRef(false);

  const [form, setForm] = useState<UpdatePositionInput>({
    costCentre: '', division: '', jobTitle: '', reportingManager: '', jd: '',
    requiredSkills: [], salaryRange: { min: 0, max: 0, currency: 'INR' },
    requiredStartDate: '', shiftTime: '', shiftDays: [], location: '',
    experienceLevel: '', impactIfUnfilled: '', sittingPlace: '',
    reviewerId: null, replacementDetails: undefined,
  });

  // Populate form once position loads (guard with ref to avoid cascading renders)
  useEffect(() => {
    if (!position || formInitialised.current) return;
    formInitialised.current = true;
    setForm({
      costCentre: position.costCentre ?? '',
      division: position.division ?? '',
      jobTitle: position.jobTitle ?? '',
      reportingManager: position.reportingManager ?? '',
      jd: position.jd ?? '',
      requiredSkills: position.requiredSkills ?? [],
      salaryRange: position.salaryRange ?? { min: 0, max: 0, currency: 'INR' },
      requiredStartDate: position.requiredStartDate ? position.requiredStartDate.slice(0, 10) : '',
      shiftTime: position.shiftTime ?? '',
      shiftDays: position.shiftDays ?? [],
      location: position.location ?? '',
      experienceLevel: position.experienceLevel ?? '',
      impactIfUnfilled: position.impactIfUnfilled ?? '',
      sittingPlace: position.sittingPlace ?? '',
      reviewerId: position.reviewerId ?? null,
      replacementDetails: position.replacementDetails,
    });
  }, [position]);

  const saveMutation = useMutation({
    mutationFn: (input: UpdatePositionInput) => updatePosition(id!, input),
    onSuccess: (updated) => {
      qc.setQueryData(['position', id], updated);
      qc.invalidateQueries({ queryKey: ['positions'] });
      navigate(`/positions/${id}`);
    },
    onError: (e) => alert(`Save failed: ${(e as Error).message}`),
  });

  const set = (k: keyof UpdatePositionInput, v: unknown) =>
    setForm(f => ({ ...f, [k]: v }));

  if (isLoading || !position) return <Layout><Spinner /></Layout>;

  // Guard — only HR_TA and Admin can reach this page (routing also guards, but belt-and-suspenders)
  if (role === 'HM') {
    return (
      <Layout>
        <div className="p-8 text-center text-slate-500">
          You don't have permission to edit submitted positions.
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHeader
        title="Edit Position"
        subtitle={`${position.jobTitle || 'Untitled'} · ${position.costCentre}`}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={position.status} />
            <Link to={`/positions/${id}`}>
              <Button variant="secondary">← Cancel</Button>
            </Link>
            <Button
              variant="primary"
              onClick={() => saveMutation.mutate(form)}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        }
      />

      <div className="space-y-6">
        {/* Core fields */}
        <Card className="p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Position details</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="Job title"
              value={form.jobTitle}
              onChange={e => set('jobTitle', e.target.value)}
            />
            <Input
              label="Cost centre"
              value={form.costCentre}
              onChange={e => set('costCentre', e.target.value)}
            />
            <Input
              label="Division / department"
              value={form.division}
              onChange={e => set('division', e.target.value)}
            />
            <Input
              label="Reporting manager"
              value={form.reportingManager}
              onChange={e => set('reportingManager', e.target.value)}
            />
            <Input
              label="Location"
              value={form.location}
              onChange={e => set('location', e.target.value)}
            />
            <Input
              label="Experience level"
              value={form.experienceLevel}
              onChange={e => set('experienceLevel', e.target.value)}
            />
            <Input
              label="Required start date"
              type="date"
              value={form.requiredStartDate}
              onChange={e => set('requiredStartDate', e.target.value)}
            />
            <Input
              label="Sitting place"
              value={form.sittingPlace}
              onChange={e => set('sittingPlace', e.target.value)}
            />
          </div>
        </Card>

        {/* Salary */}
        <Card className="p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Salary range</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Input
              label="Min (₹)"
              type="number"
              value={form.salaryRange.min}
              onChange={e => set('salaryRange', { ...form.salaryRange, min: Number(e.target.value) })}
            />
            <Input
              label="Max (₹)"
              type="number"
              value={form.salaryRange.max}
              onChange={e => set('salaryRange', { ...form.salaryRange, max: Number(e.target.value) })}
            />
            <Select
              label="Currency"
              value={form.salaryRange.currency}
              onChange={e => set('salaryRange', { ...form.salaryRange, currency: e.target.value })}
            >
              <option value="INR">INR</option>
              <option value="USD">USD</option>
              <option value="GBP">GBP</option>
            </Select>
          </div>
        </Card>

        {/* JD & skills */}
        <Card className="p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Job description</h2>
          <div className="space-y-4">
            <Textarea
              label="Job description"
              rows={6}
              value={form.jd}
              onChange={e => set('jd', e.target.value)}
            />
            <div>
              <span className="block text-sm font-medium text-slate-700 mb-1">Required skills</span>
              <TagInput
                  values={form.requiredSkills}
                  onChange={tags => set('requiredSkills', tags)}
                  placeholder="Type a skill and press Enter"
                />
            </div>
            <Textarea
              label="Impact if unfilled"
              rows={2}
              value={form.impactIfUnfilled}
              onChange={e => set('impactIfUnfilled', e.target.value)}
            />
          </div>
        </Card>

        {/* Reviewer */}
        <Card className="p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Approval reviewer</h2>
          <Select
            label="Reviewer (DoA)"
            value={form.reviewerId ?? ''}
            onChange={e => set('reviewerId', e.target.value || null)}
          >
            <option value="">— No reviewer assigned —</option>
            {(doaList ?? []).map(d => (
              <option key={d.id} value={d.id}>{d.name} · {d.title}</option>
            ))}
          </Select>
        </Card>
      </div>
    </Layout>
  );
}
