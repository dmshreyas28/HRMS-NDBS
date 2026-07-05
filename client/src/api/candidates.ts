import { api } from "./client";

export interface Candidate {
  id: string;
  positionId: string;
  fullName: string;
  email: string;
  phone: string;
  source: "JOB_BOARD" | "REFERRAL" | "DIRECT" | "OTHER";
  cvFileUrl: string;
  currentStage: "APPLIED" | "SCREENING" | "INTERVIEW_SCHEDULED" | "INTERVIEW_COMPLETED" | "OFFER" | "HIRED" | "REJECTED" | "WITHDRAWN";
  stageHistory: Array<{ stage: string; movedAt: string; movedBy: string; notes: string }>;
  interviewFeedback: Array<{ stage: string; interviewer: string; rating: number; feedback: string; date: string }>;
  offer?: { salary: number; startDate: string; offerLetterStatus: "NOT_SENT" | "SENT" | "ACCEPTED" | "DECLINED" };
  createdAt: string;
  updatedAt: string;
}

export function listCandidates(positionId: string): Promise<Candidate[]> {
  return api.get<Candidate[]>(`/api/positions/${positionId}/candidates`);
}

export function getCandidate(positionId: string, id: string): Promise<Candidate> {
  return api.get<Candidate>(`/api/positions/${positionId}/candidates/${id}`);
}

export function createCandidate(positionId: string, input: { fullName: string; email: string; phone: string; source: string; cvFileUrl?: string }): Promise<Candidate> {
  return api.post<Candidate>(`/api/positions/${positionId}/candidates`, input);
}

export function updateCandidate(positionId: string, id: string, input: { fullName: string; email: string; phone: string; source: string }): Promise<Candidate> {
  return api.patch<Candidate>(`/api/positions/${positionId}/candidates/${id}`, input);
}

export function transitionCandidateStage(positionId: string, id: string, stage: string, notes: string): Promise<Candidate> {
  return api.patch<Candidate>(`/api/positions/${positionId}/candidates/${id}/stage`, { stage, notes });
}

export function addCandidateFeedback(positionId: string, id: string, feedback: { stage: string; interviewer: string; rating: number; feedback: string }): Promise<Candidate> {
  return api.post<Candidate>(`/api/positions/${positionId}/candidates/${id}/feedback`, feedback);
}

export function setCandidateOffer(positionId: string, id: string, offer: { salary: number; startDate: string; offerLetterStatus: string }): Promise<Candidate> {
  return api.post<Candidate>(`/api/positions/${positionId}/candidates/${id}/offer`, offer);
}

export function deleteCandidate(positionId: string, id: string): Promise<void> {
  return api.delete<void>(`/api/positions/${positionId}/candidates/${id}`);
}

export async function uploadCvFile(positionId: string, id: string, file: File): Promise<Candidate> {
  const formData = new FormData();
  formData.append("file", file);
  return api.post<Candidate>(`/api/positions/${positionId}/candidates/${id}/cv`, formData);
}
