import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '../components/Layout';
import { PageHeader, Card, Button, Spinner, EmptyState, Modal, Input, Select, Textarea } from '../components/ui';
import { CandidateStageBadge } from '../components/StatusBadge';
import { formatDate, formatDateTime, uploadsBase, CANDIDATE_STAGES } from '../utils/constants';
import { useAuthStore } from '../store/authStore';
import {
  getCandidate,
  transitionCandidateStage,
  addCandidateFeedback,
  deleteCandidate,
  type Candidate,
} from '../api/candidates';

const STAGES = CANDIDATE_STAGES;

export function CandidateDetailPage() {
  const { id: positionId, cid } = useParams<{ id: string; cid: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const user = useAuthStore(s => s.user);
  const role = user?.role ?? 'HM';
  const canAct = role === 'HR_TA' || role === 'Admin';

  const [moveOpen, setMoveOpen] = useState(false);
  const [fbOpen, setFbOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const { data: candidate, isLoading } = useQuery({
    queryKey: ['candidate', positionId, cid],
    queryFn: () => getCandidate(positionId!, cid!),
    enabled: !!positionId && !!cid,
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteCandidate(positionId!, cid!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['candidates', positionId] });
      navigate(`/positions/${positionId}/candidates`);
    },
    onError: (e) => alert(`Delete failed: ${(e as Error).message}`),
  });

  if (isLoading) return <Layout><Spinner /></Layout>;
  if (!candidate) return <Layout><EmptyState title="Candidate not found" /></Layout>;

  const c = candidate;

  return (
    <Layout>
      <PageHeader
        title={c.fullName}
        subtitle={`${c.email}${c.phone ? ` · ${c.phone}` : ''}`}
        actions={
          <div className="flex items-center gap-2">
            <Link to={`/positions/${positionId}/candidates`}>
              <Button variant="secondary">← Pipeline</Button>
            </Link>
            {canAct && (
              <>
                <Button variant="secondary" onClick={() => setMoveOpen(true)}>Move Stage</Button>
                <Button variant="secondary" onClick={() => setFbOpen(true)}>+ Feedback</Button>
                <Button
                  variant="danger"
                  onClick={() => setConfirmDeleteOpen(true)}
                  disabled={deleteMutation.isPending}
                >
                  Remove
                </Button>
              </>
            )}
          </div>
        }
      />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left — main info */}
        <div className="lg:col-span-2 space-y-4">
          {/* Overview */}
          <Card className="p-5">
            <div className="grid sm:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase mb-1">Current stage</p>
                <CandidateStageBadge stage={c.currentStage} />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase mb-1">Source</p>
                <p className="text-slate-800">{c.source.replace(/_/g, ' ')}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase mb-1">CV</p>
                {c.cvFileUrl
                  ? <a href={`${uploadsBase}${c.cvFileUrl}`} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline text-sm">View CV ↗</a>
                  : <span className="text-slate-400 text-sm">None uploaded</span>}
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-400">
              Added {formatDate(c.createdAt)} · Last updated {formatDate(c.updatedAt)}
            </div>
          </Card>

          {/* Offer details */}
          <Card className="p-5">
            <h3 className="font-semibold text-slate-900 mb-3">Offer details</h3>
            {c.offer ? (
              <dl className="grid sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <dt className="text-xs text-slate-500 uppercase">Salary</dt>
                  <dd className="text-slate-800 font-medium">₹{c.offer.salary?.toLocaleString()}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500 uppercase">Start date</dt>
                  <dd className="text-slate-800">{formatDate(c.offer.startDate)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500 uppercase">Offer letter</dt>
                  <dd className="text-slate-800">{c.offer.offerLetterStatus ?? 'NOT_SENT'}</dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-slate-500">No offer details yet.</p>
            )}
          </Card>

          {/* Interview feedback */}
          <Card className="p-5">
            <h3 className="font-semibold text-slate-900 mb-3">Interview feedback</h3>
            {!c.interviewFeedback?.length ? (
              <p className="text-sm text-slate-500">No feedback logged yet.</p>
            ) : (
              <ul className="space-y-3">
                {c.interviewFeedback.map((f, i) => (
                  <li key={i} className="border-l-2 border-brand-200 pl-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-800">{f.stage.replace(/_/g, ' ')} · {f.interviewer}</span>
                      <span className="text-xs text-amber-500">{'★'.repeat(f.rating)}{'☆'.repeat(5 - f.rating)}</span>
                    </div>
                    <p className="text-sm text-slate-600 mt-0.5">{f.feedback}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{formatDateTime(f.date)}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* Right — stage history */}
        <div>
          <Card className="p-5">
            <h3 className="font-semibold text-slate-900 mb-4">Stage history</h3>
            {!c.stageHistory?.length ? (
              <p className="text-sm text-slate-500">No history yet.</p>
            ) : (
              <ol className="space-y-3">
                {[...c.stageHistory].reverse().map((h, i) => (
                  <li key={i} className="text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-800">{h.stage.replace(/_/g, ' ')}</span>
                      <span className="text-xs text-slate-400">{formatDateTime(h.movedAt)}</span>
                    </div>
                    {h.notes && <p className="text-xs text-slate-500 mt-0.5">{h.notes}</p>}
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>
      </div>

      <MoveStageModal
        open={moveOpen}
        onClose={() => setMoveOpen(false)}
        candidate={c}
        positionId={positionId!}
        onSuccess={() => qc.invalidateQueries({ queryKey: ['candidate', positionId, cid] })}
      />
      <FeedbackModal
        open={fbOpen}
        onClose={() => setFbOpen(false)}
        candidate={c}
        positionId={positionId!}
        onSuccess={() => qc.invalidateQueries({ queryKey: ['candidate', positionId, cid] })}
      />

      <Modal
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        title="Remove Candidate"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Are you sure you want to remove this candidate? This action cannot be undone.</p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setConfirmDeleteOpen(false)}>Cancel</Button>
            <Button
              variant="danger"
              disabled={deleteMutation.isPending}
              onClick={() => {
                deleteMutation.mutate(undefined, {
                  onSuccess: () => setConfirmDeleteOpen(false),
                  onError: () => setConfirmDeleteOpen(false),
                });
              }}
            >
              Remove
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}

function MoveStageModal({ open, onClose, candidate, positionId, onSuccess }: {
  open: boolean; onClose: () => void; candidate: Candidate; positionId: string; onSuccess: () => void;
}) {
  const [stage, setStage] = useState(candidate.currentStage);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      await transitionCandidateStage(positionId, candidate.id, stage, notes);
      onSuccess();
      onClose();
      setNotes('');
    } catch (e) {
      alert(`Failed: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Move candidate stage">
      <div className="space-y-3">
        <Select label="New stage" value={stage} onChange={e => setStage(e.target.value as typeof stage)}>
          {STAGES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </Select>
        <Textarea label="Notes (optional)" rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
        <p className="text-xs text-slate-500">Moving to HIRED will automatically close the position as Filled.</p>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="success" onClick={submit} disabled={busy}>{busy ? 'Saving…' : 'Move'}</Button>
      </div>
    </Modal>
  );
}

function FeedbackModal({ open, onClose, candidate, positionId, onSuccess }: {
  open: boolean; onClose: () => void; candidate: Candidate; positionId: string; onSuccess: () => void;
}) {
  const [fb, setFb] = useState({ stage: 'INTERVIEW_COMPLETED', interviewer: '', rating: 3, feedback: '' });
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!fb.interviewer.trim()) { alert('Interviewer name is required.'); return; }
    if (!fb.feedback.trim()) { alert('Feedback text is required.'); return; }
    setBusy(true);
    try {
      await addCandidateFeedback(positionId, candidate.id, fb);
      onSuccess();
      onClose();
      setFb({ stage: 'INTERVIEW_COMPLETED', interviewer: '', rating: 3, feedback: '' });
    } catch (e) {
      alert(`Failed: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add interview feedback">
      <div className="space-y-3">
        <Input label="Interviewer name" value={fb.interviewer} onChange={e => setFb({ ...fb, interviewer: e.target.value })} />
        <Select label="Stage" value={fb.stage} onChange={e => setFb({ ...fb, stage: e.target.value })}>
          {STAGES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </Select>
        <Select label="Rating" value={fb.rating} onChange={e => setFb({ ...fb, rating: Number(e.target.value) })}>
          {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{'★'.repeat(n)}{'☆'.repeat(5 - n)} ({n}/5)</option>)}
        </Select>
        <Textarea label="Feedback notes" rows={3} value={fb.feedback} onChange={e => setFb({ ...fb, feedback: e.target.value })} />
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={submit} disabled={busy}>{busy ? 'Saving…' : 'Save feedback'}</Button>
      </div>
    </Modal>
  );
}
