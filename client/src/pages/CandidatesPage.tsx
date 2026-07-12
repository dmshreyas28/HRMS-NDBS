import { useState } from "react";
import { useParams, Link } from "react-router-dom";
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
    mutationFn: (input: any) => createCandidate(positionId!, input),
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
      queryClient.invalidateQueries({ queryKey: ["position", positionId] }); // in case position gets FILLED
      if (selectedCandidate?.id === updatedCand.id) {
        setSelectedCandidate(updatedCand);
      }
    },
    onError: (e) => alert(`Stage transition failed: ${(e as Error).message}`),
  });

  const feedbackMutation = useMutation({
    mutationFn: ({ candidateId, feedback }: { candidateId: string; feedback: any }) =>
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
    mutationFn: ({ candidateId, offer }: { candidateId: string; offer: any }) =>
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

  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between border-b pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">ATS Candidates</h1>
            <span className="rounded bg-indigo-50 border border-indigo-100 px-2 py-0.5 text-xs text-indigo-700 font-semibold uppercase">
              {pos?.jobCode}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Tracking candidates for <Link to={`/positions/${positionId}`} className="text-indigo-600 font-semibold hover:underline">{pos?.jobTitle}</Link>
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-600/10 hover:bg-indigo-700 transition-all"
          >
            Add Candidate
          </button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-slate-500 py-8 text-center">Loading candidates pipeline…</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => {
            const list = candidates?.filter((c) => c.currentStage === stage.id) ?? [];
            return (
              <div key={stage.id} className="min-w-[180px] bg-slate-100/50 rounded-xl p-3 border border-slate-200/80 flex flex-col h-[500px]">
                <div className="flex items-center justify-between mb-3 border-b pb-2">
                  <span className="text-xs font-bold text-slate-600 tracking-wide uppercase truncate">{stage.label}</span>
                  <span className="rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold h-5 w-5 flex items-center justify-center shrink-0">
                    {list.length}
                  </span>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto">
                  {list.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => {
                        setSelectedCandidate(c);
                        setOfferSalary(c.offer?.salary ? String(c.offer.salary) : "");
                        setOfferStartDate(c.offer?.startDate ? c.offer.startDate.substring(0, 10) : "");
                        setOfferStatus(c.offer?.offerLetterStatus || "SENT");
                      }}
                      className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm hover:shadow cursor-pointer transition-shadow"
                    >
                      <p className="text-xs font-bold text-slate-800 line-clamp-1">{c.fullName}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate">{c.email}</p>
                      <div className="mt-2.5 flex items-center justify-between gap-1">
                        <span className="text-[9px] font-medium text-slate-400 capitalize">{c.source.toLowerCase().replace("_", " ")}</span>
                        {/* Quick Move Stage Actions */}
                        <select
                          value={c.currentStage}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => stageMutation.mutate({ candidateId: c.id, stage: e.target.value, notes: "Stage updated." })}
                          className="text-[9px] rounded border border-slate-200 p-0.5 bg-slate-50 text-slate-600 font-bold"
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

      {/* Candidate Profile / Feedback / Offer Letter Detail Drawer Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-end z-50">
          <div className="w-full max-w-lg bg-white shadow-2xl h-full flex flex-col overflow-y-auto p-6 border-l border-slate-200 animate-slide-in">
            <div className="flex items-center justify-between border-b pb-4 mb-5">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{selectedCandidate.fullName}</h3>
                <span className="inline-block mt-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 border rounded px-2 py-0.5 uppercase tracking-wide">
                  {selectedCandidate.currentStage}
                </span>
              </div>
              <button onClick={() => setSelectedCandidate(null)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">&times; Close</button>
            </div>

            <div className="space-y-6 flex-1 text-sm text-slate-700">
              {/* Contact info & CV details */}
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

              {/* Offer Details Form (Shows only when stage is OFFER or HIRED) */}
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
                          className="w-full rounded border p-1.5"
                          required
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-500 mb-1">Proposed Start Date</label>
                        <input
                          type="date"
                          value={offerStartDate}
                          onChange={(e) => setOfferStartDate(e.target.value)}
                          className="w-full rounded border p-1.5"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-500 mb-1">Offer Letter Status</label>
                      <select value={offerStatus} onChange={(e) => setOfferStatus(e.target.value)} className="w-full rounded border p-1.5">
                        <option value="NOT_SENT">Not Sent</option>
                        <option value="SENT">Sent to Candidate</option>
                        <option value="ACCEPTED">Accepted by Candidate</option>
                        <option value="DECLINED">Declined by Candidate</option>
                      </select>
                    </div>
                    <button type="submit" disabled={offerMutation.isPending} className="rounded bg-indigo-600 text-white px-3 py-1.5 font-bold hover:bg-indigo-700 disabled:opacity-50">
                      Save Offer Details
                    </button>
                  </form>
                </section>
              )}

              {/* Log Interview Feedback Form */}
              <section className="border rounded-xl p-4 space-y-4">
                <h4 className="font-bold text-xs uppercase tracking-wide text-slate-400">Log Interview Feedback</h4>
                <form onSubmit={handleFeedbackSubmit} className="space-y-3 text-xs">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-500 mb-1">Interview Stage</label>
                      <select value={feedbackStage} onChange={(e) => setFeedbackStage(e.target.value)} className="w-full rounded border p-1.5">
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
                        className="w-full rounded border p-1.5"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-500 mb-1">Rating (1-5 Stars)</label>
                    <select value={feedbackRating} onChange={(e) => setFeedbackRating(e.target.value)} className="w-full rounded border p-1.5">
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
                      className="w-full rounded border p-1.5"
                      required
                    />
                  </div>
                  <button type="submit" disabled={feedbackMutation.isPending} className="rounded bg-slate-900 text-white px-3 py-1.5 font-bold hover:bg-slate-800 disabled:opacity-50">
                    Submit Feedback Log
                  </button>
                </form>
              </section>

              {/* Feedback History log */}
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
                          <span className="text-indigo-600 font-extrabold">{f.rating} / 5 Rating</span>
                        </div>
                        <p className="text-slate-600">{f.feedback}</p>
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
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateSubmit} className="w-full max-w-md bg-white rounded-xl shadow-xl p-6 border border-slate-100 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Add New Candidate</h3>
            <p className="text-xs text-slate-400">Insert applicant details. You can attach a CV file below.</p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Full Name</label>
                <input value={candName} onChange={(e) => setCandName(e.target.value)} className="w-full rounded border p-2 text-sm" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Email</label>
                <input type="email" value={candEmail} onChange={(e) => setCandEmail(e.target.value)} className="w-full rounded border p-2 text-sm" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Phone Number</label>
                <input value={candPhone} onChange={(e) => setCandPhone(e.target.value)} className="w-full rounded border p-2 text-sm" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Source</label>
                <select value={candSource} onChange={(e) => setCandSource(e.target.value)} className="w-full rounded border p-2 text-sm">
                  <option value="JOB_BOARD">Job Board (LinkedIn, etc)</option>
                  <option value="REFERRAL">Internal Employee Referral</option>
                  <option value="DIRECT">Direct Applicant</option>
                  <option value="OTHER">Other / Agency</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Attach CV (PDF, optional)</label>
                <input type="file" accept=".pdf,.doc,.docx" onChange={handleCvFileChange} className="w-full text-xs" />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t">
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setCvFile(null);
                }}
                className="rounded-lg border px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/10 disabled:opacity-50"
              >
                {createMutation.isPending ? "Adding..." : "Add Candidate"}
              </button>
            </div>
          </form>
        </div>
      )}
    </Layout>
  );
}
