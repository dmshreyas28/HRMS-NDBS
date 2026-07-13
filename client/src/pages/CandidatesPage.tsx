import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "../components/Layout";
import { getPosition } from "../api/positions";
import {
  listCandidates,
  createCandidate,
  transitionCandidateStage,
  addCandidateFeedback,
  setCandidateOffer,
  uploadCvFile,
} from "../api/candidates";
import type { Candidate } from "../api/candidates";
import { API_BASE_URL } from "../api/client";
import { PageHeader, Spinner, Button, Input, Select, Modal } from "../components/ui";
import { CandidateStageBadge } from "../components/StatusBadge";

const STAGES = [
  { id: "APPLIED", label: "Applied" },
  { id: "SCREENING", label: "Screening" },
  { id: "INTERVIEW_SCHEDULED", label: "Interview Scheduled" },
  { id: "INTERVIEW_COMPLETED", label: "Interview Feedback" },
  { id: "OFFER", label: "Offer Details" },
  { id: "HIRED", label: "Hired" },
];

export function CandidatesPage() {
  const { id: positionId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Add Candidate Form State
  const [candName, setCandName] = useState("");
  const [candEmail, setCandEmail] = useState("");
  const [candPhone, setCandPhone] = useState("");
  const [candSource, setCandSource] = useState("JOB_BOARD");

  // Feedback Form State
  const [feedbackStage, setFeedbackStage] = useState("SCREENING");
  const [feedbackInterviewer, setFeedbackInterviewer] = useState("");
  const [feedbackRating, setFeedbackRating] = useState("5");
  const [feedbackText, setFeedbackText] = useState("");

  // Offer Form State
  const [offerSalary, setOfferSalary] = useState("");
  const [offerStartDate, setOfferStartDate] = useState("");
  const [offerStatus, setOfferStatus] = useState("SENT");

  // CV File Upload
  const [cvFile, setCvFile] = useState<File | null>(null);

  const { data: pos } = useQuery({
    queryKey: ["position", positionId],
    queryFn: () => getPosition(positionId!),
  });

  const { data: candidates, isLoading } = useQuery({
    queryKey: ["candidates", positionId],
    queryFn: () => listCandidates(positionId!),
  });

  const createMutation = useMutation({
    mutationFn: (input: { fullName: string; email: string; phone: string; source: string; cvFileUrl?: string }) => createCandidate(positionId!, input),
    onSuccess: (newCand) => {
      queryClient.invalidateQueries({ queryKey: ["candidates", positionId] });
      setShowAddModal(false);
      setCandName("");
      setCandEmail("");
      setCandPhone("");
      // If there's a file, upload it immediately
      if (cvFile && newCand.id) {
        uploadCvMutation.mutate({ candidateId: newCand.id, file: cvFile });
      }
      setCvFile(null);
    },
    onError: (e) => alert(`Failed to add candidate: ${(e as Error).message}`),
  });

  const uploadCvMutation = useMutation({
    mutationFn: ({ candidateId, file }: { candidateId: string; file: File }) =>
      uploadCvFile(positionId!, candidateId, file),
    onSuccess: (updatedCand) => {
      queryClient.invalidateQueries({ queryKey: ["candidates", positionId] });
      if (selectedCandidate?.id === updatedCand.id) {
        setSelectedCandidate(updatedCand);
      }
      alert("CV uploaded successfully!");
    },
    onError: (e) => alert(`CV upload failed: ${(e as Error).message}`),
  });

  const stageMutation = useMutation({
    mutationFn: ({ candidateId, stage, notes }: { candidateId: string; stage: string; notes: string }) =>
      transitionCandidateStage(positionId!, candidateId, stage, notes),
    onSuccess: (updatedCand) => {
      queryClient.invalidateQueries({ queryKey: ["candidates", positionId] });
      queryClient.invalidateQueries({ queryKey: ["position", positionId] });
      if (selectedCandidate?.id === updatedCand.id) {
        setSelectedCandidate(updatedCand);
      }
    },
    onError: (e) => alert(`Stage transition failed: ${(e as Error).message}`),
  });

  const feedbackMutation = useMutation({
    mutationFn: ({ candidateId, feedback }: { candidateId: string; feedback: { stage: string; interviewer: string; rating: number; feedback: string } }) =>
      addCandidateFeedback(positionId!, candidateId, feedback),
    onSuccess: (updatedCand) => {
      queryClient.invalidateQueries({ queryKey: ["candidates", positionId] });
      if (selectedCandidate?.id === updatedCand.id) {
        setSelectedCandidate(updatedCand);
      }
      setFeedbackInterviewer("");
      setFeedbackText("");
      alert("Feedback saved!");
    },
    onError: (e) => alert(`Failed to log feedback: ${(e as Error).message}`),
  });

  const offerMutation = useMutation({
    mutationFn: ({ candidateId, offer }: { candidateId: string; offer: { salary: number; startDate: string; offerLetterStatus: string } }) =>
      setCandidateOffer(positionId!, candidateId, offer),
    onSuccess: (updatedCand) => {
      queryClient.invalidateQueries({ queryKey: ["candidates", positionId] });
      if (selectedCandidate?.id === updatedCand.id) {
        setSelectedCandidate(updatedCand);
      }
      alert("Offer details updated!");
    },
    onError: (e) => alert(`Failed to update offer: ${(e as Error).message}`),
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      fullName: candName,
      email: candEmail,
      phone: candPhone,
      source: candSource,
      cvFileUrl: "",
    });
  };

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate) return;
    feedbackMutation.mutate({
      candidateId: selectedCandidate.id,
      feedback: {
        stage: feedbackStage,
        interviewer: feedbackInterviewer,
        rating: Number(feedbackRating),
        feedback: feedbackText,
      },
    });
  };

  const handleOfferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate) return;
    offerMutation.mutate({
      candidateId: selectedCandidate.id,
      offer: {
        salary: Number(offerSalary),
        startDate: new Date(offerStartDate).toISOString(),
        offerLetterStatus: offerStatus,
      },
    });
  };

  const handleCvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (selectedCandidate) {
        uploadCvMutation.mutate({ candidateId: selectedCandidate.id, file });
      } else {
        setCvFile(file);
      }
    }
  };

  const handleDragStart = (e: React.DragEvent, candidateId: string) => {
    e.dataTransfer.setData("text/plain", candidateId);
  };

  const handleDrop = (e: React.DragEvent, stageId: string) => {
    const candidateId = e.dataTransfer.getData("text/plain");
    if (candidateId) {
      stageMutation.mutate({ candidateId, stage: stageId, notes: "Moved via Kanban drag-and-drop." });
    }
  };

  return (
    <Layout>
      <PageHeader
        title="ATS Candidates"
        subtitle={`Tracking candidates for ${pos?.jobTitle || "Requisition"}`}
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => navigate(`/positions/${positionId}`)}>
              ← Details
            </Button>
            <Button variant="primary" onClick={() => setShowAddModal(true)}>
              Add Candidate
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => {
            const list = candidates?.filter((c) => c.currentStage === stage.id) ?? [];
            return (
              <div
                key={stage.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, stage.id)}
                className="min-w-[190px] bg-slate-100/50 rounded-xl p-3 border border-slate-200/80 flex flex-col h-[520px] hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center justify-between mb-3 border-b pb-2">
                  <span className="text-[10px] font-bold text-slate-500 tracking-wide uppercase truncate">{stage.label}</span>
                  <span className="rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold h-5 w-5 flex items-center justify-center shrink-0">
                    {list.length}
                  </span>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto">
                  {list.map((c) => (
                    <div
                      key={c.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, c.id)}
                      onClick={() => {
                        setSelectedCandidate(c);
                        setOfferSalary(c.offer?.salary ? String(c.offer.salary) : "");
                        setOfferStartDate(c.offer?.startDate ? c.offer.startDate.substring(0, 10) : "");
                        setOfferStatus(c.offer?.offerLetterStatus || "SENT");
                      }}
                      className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm hover:shadow cursor-pointer transition-shadow active:cursor-grabbing hover:border-brand-300"
                    >
                      <p className="text-xs font-bold text-slate-800 line-clamp-1">{c.fullName}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate">{c.email}</p>
                      <div className="mt-2.5 flex items-center justify-between gap-1">
                        <span className="text-[9px] font-medium text-slate-400 capitalize">{c.source.toLowerCase().replace("_", " ")}</span>
                        <select
                          value={c.currentStage}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => stageMutation.mutate({ candidateId: c.id, stage: e.target.value, notes: "Stage updated." })}
                          className="text-[9px] rounded border border-slate-200 p-0.5 bg-slate-50 text-slate-655 font-bold cursor-pointer"
                        >
                          {STAGES.map((s) => (
                            <option key={s.id} value={s.id}>{s.label}</option>
                          ))}
                          <option value="REJECTED">Rejected</option>
                          <option value="WITHDRAWN">Withdrawn</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Candidate Profile Detail Drawer Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-end z-50">
          <div className="w-full max-w-lg bg-white shadow-2xl h-full flex flex-col overflow-y-auto p-6 border-l border-slate-200 animate-slide-in">
            <div className="flex items-center justify-between border-b pb-4 mb-5">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{selectedCandidate.fullName}</h3>
                <span className="mt-1 block">
                  <CandidateStageBadge stage={selectedCandidate.currentStage} />
                </span>
              </div>
              <button onClick={() => setSelectedCandidate(null)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">&times; Close</button>
            </div>

            <div className="space-y-6 flex-1 text-sm text-slate-700">
              {/* Contact info */}
              <section className="bg-slate-50 p-4 rounded-xl border space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wide text-slate-400">Contact Details</h4>
                <p><span className="font-semibold text-slate-500">Email:</span> {selectedCandidate.email}</p>
                <p><span className="font-semibold text-slate-500">Phone:</span> {selectedCandidate.phone}</p>
                <p><span className="font-semibold text-slate-500">Source:</span> <span className="capitalize">{selectedCandidate.source.toLowerCase().replace("_", " ")}</span></p>
                <div className="border-t pt-3 mt-3 flex items-center justify-between gap-4">
                  <div>
                    <span className="font-semibold block text-slate-500 text-xs">Curriculum Vitae (CV)</span>
                    {selectedCandidate.cvFileUrl ? (
                      <a
                        href={`${API_BASE_URL}${selectedCandidate.cvFileUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-indigo-600 font-bold hover:underline block mt-1"
                      >
                        Download Uploaded CV
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400 block mt-1">No file uploaded</span>
                    )}
                  </div>
                  <label className="rounded border bg-white border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer">
                    Upload CV (PDF)
                    <input type="file" accept=".pdf,.doc,.docx" onChange={handleCvFileChange} className="hidden" />
                  </label>
                </div>
              </section>

              {/* Offer Details */}
              {(selectedCandidate.currentStage === "OFFER" || selectedCandidate.currentStage === "HIRED") && (
                <section className="border border-indigo-100 rounded-xl bg-indigo-50/10 p-4 space-y-4">
                  <h4 className="font-bold text-xs uppercase tracking-wide text-indigo-700">Offer Letter Details</h4>
                  <form onSubmit={handleOfferSubmit} className="space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-500 mb-1">Salary Offer (Annual INR)</label>
                        <input
                          type="number"
                          value={offerSalary}
                          onChange={(e) => setOfferSalary(e.target.value)}
                          className="w-full rounded border border-slate-300 p-1.5"
                          required
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-500 mb-1">Proposed Start Date</label>
                        <input
                          type="date"
                          value={offerStartDate}
                          onChange={(e) => setOfferStartDate(e.target.value)}
                          className="w-full rounded border border-slate-300 p-1.5"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-500 mb-1">Offer Letter Status</label>
                      <select value={offerStatus} onChange={(e) => setOfferStatus(e.target.value)} className="w-full rounded border border-slate-300 p-1.5 bg-white">
                        <option value="NOT_SENT">Not Sent</option>
                        <option value="SENT">Sent to Candidate</option>
                        <option value="ACCEPTED">Accepted by Candidate</option>
                        <option value="DECLINED">Declined by Candidate</option>
                      </select>
                    </div>
                    <Button type="submit" variant="primary" disabled={offerMutation.isPending}>
                      Save Offer Details
                    </Button>
                  </form>
                </section>
              )}

              {/* Feedback Form */}
              <section className="border border-slate-200 rounded-xl p-4 space-y-4">
                <h4 className="font-bold text-xs uppercase tracking-wide text-slate-400">Log Interview Feedback</h4>
                <form onSubmit={handleFeedbackSubmit} className="space-y-3 text-xs">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-500 mb-1">Interview Stage</label>
                      <select value={feedbackStage} onChange={(e) => setFeedbackStage(e.target.value)} className="w-full rounded border border-slate-300 p-1.5 bg-white">
                        <option value="SCREENING">Screening</option>
                        <option value="INTERVIEW_SCHEDULED">Technical Round 1</option>
                        <option value="INTERVIEW_COMPLETED">HR Interview</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block font-semibold text-slate-500 mb-1">Interviewer Name(s)</label>
                      <input
                        value={feedbackInterviewer}
                        onChange={(e) => setFeedbackInterviewer(e.target.value)}
                        placeholder="e.g. Sarah Smith"
                        className="w-full rounded border border-slate-300 p-1.5"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-500 mb-1">Rating (1-5 Stars)</label>
                    <select value={feedbackRating} onChange={(e) => setFeedbackRating(e.target.value)} className="w-full rounded border border-slate-300 p-1.5 bg-white">
                      <option value="5">5 - Excellent Fit</option>
                      <option value="4">4 - Strong Fit</option>
                      <option value="3">3 - Solid Competency</option>
                      <option value="2">2 - Requires Upskilling</option>
                      <option value="1">1 - Clear Reject</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-500 mb-1">Interview Comments / Feedback notes</label>
                    <textarea
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="Type details regarding skills assessed, coding performance, cultural fit, etc..."
                      rows={3}
                      className="w-full rounded border border-slate-300 p-1.5"
                      required
                    />
                  </div>
                  <Button type="submit" variant="primary" disabled={feedbackMutation.isPending}>
                    Submit Feedback Log
                  </Button>
                </form>
              </section>

              {/* Feedback History */}
              <section className="space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wide text-slate-400">Feedback History ({selectedCandidate.interviewFeedback.length})</h4>
                {selectedCandidate.interviewFeedback.length === 0 ? (
                  <p className="text-xs text-slate-400 py-2">No feedback logged yet.</p>
                ) : (
                  <div className="space-y-3">
                    {selectedCandidate.interviewFeedback.map((f, i) => (
                      <div key={i} className="bg-slate-50 border rounded-lg p-3 text-xs leading-normal">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-slate-700 capitalize">{f.stage.toLowerCase().replace("_", " ")}</span>
                          <span className="text-indigo-650 font-extrabold">{f.rating} / 5 Rating</span>
                        </div>
                        <p className="text-slate-655">{f.feedback}</p>
                        <span className="text-[10px] text-slate-400 mt-1 block">Interviewer: {f.interviewer} · {new Date(f.date).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Stage History */}
              <section className="space-y-3 border-t pt-4">
                <h4 className="font-bold text-xs uppercase tracking-wide text-slate-400">Stage Transitions History</h4>
                <div className="space-y-2 border-l border-slate-200 pl-4 text-xs ml-1">
                  {selectedCandidate.stageHistory.map((h, i) => (
                    <div key={i} className="relative py-1">
                      <span className="absolute -left-[21px] top-2 h-2.5 w-2.5 rounded-full bg-slate-300 ring-4 ring-white"></span>
                      <p className="font-bold text-slate-800">{h.stage}</p>
                      <p className="text-[10px] text-slate-400">{new Date(h.movedAt).toLocaleString()} · {h.notes}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* Add Candidate Modal */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Candidate">
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <p className="text-xs text-slate-400">Insert applicant details. You can attach a CV file below.</p>

          <div className="space-y-3">
            <Input label="Full Name" value={candName} onChange={(e) => setCandName(e.target.value)} required />
            <Input type="email" label="Email" value={candEmail} onChange={(e) => setCandEmail(e.target.value)} required />
            <Input label="Phone Number" value={candPhone} onChange={(e) => setCandPhone(e.target.value)} required />
            <Select label="Source" value={candSource} onChange={(e) => setCandSource(e.target.value)}>
              <option value="JOB_BOARD">Job Board (LinkedIn, etc)</option>
              <option value="REFERRAL">Internal Employee Referral</option>
              <option value="DIRECT">Direct Applicant</option>
              <option value="OTHER">Other / Agency</option>
            </Select>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Attach CV (PDF, optional)</label>
              <input type="file" accept=".pdf,.doc,.docx" onChange={handleCvFileChange} className="w-full text-xs" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t">
            <Button variant="secondary" onClick={() => { setShowAddModal(false); setCvFile(null); }}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Adding..." : "Add Candidate"}
            </Button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
