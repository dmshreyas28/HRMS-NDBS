import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listPositions, getPosition, getAuditTrail, createPosition, deletePosition, updatePosition, submitPosition, approvePosition, rejectPosition, type CreatePositionInput, type UpdatePositionInput } from "../api/positions";
import type { PositionStatus } from "../types/models";

export function usePositions(status?: PositionStatus) {
  return useQuery({ queryKey: ["positions", status ?? "all"] as const, queryFn: () => listPositions(status) });
}

export function usePosition(id: string | undefined) {
  return useQuery({ queryKey: ["position", id] as const, queryFn: () => getPosition(id!), enabled: !!id });
}

export function useAuditTrail(id: string | undefined) {
  return useQuery({ queryKey: ["audit", id] as const, queryFn: () => getAuditTrail(id!), enabled: !!id });
}

export function useCreateDraft() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (input: CreatePositionInput) => createPosition(input), onSuccess: () => { qc.invalidateQueries({ queryKey: ["positions"] }); } });
}

export function useDeleteDraft() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: deletePosition, onSuccess: () => { qc.invalidateQueries({ queryKey: ["positions"] }); } });
}

export function useUpdateDraft(id: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (input: UpdatePositionInput) => updatePosition(id, input), onSuccess: (updated) => { qc.setQueryData(["position", id] as const, updated); qc.invalidateQueries({ queryKey: ["positions"] }); } });
}

export function useSubmitPosition() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, input }: { id: string; input: { reviewerId?: string | null; approvalSkipped: boolean; approvalSkippedReason?: string | null } }) => submitPosition(id, input), onSuccess: () => { qc.invalidateQueries({ queryKey: ["positions"] }); } });
}

export function useApprovePosition() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, notes }: { id: string; notes: string }) => approvePosition(id, notes), onSuccess: () => { qc.invalidateQueries({ queryKey: ["positions"] }); } });
}

export function useRejectPosition() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectPosition(id, reason), onSuccess: () => { qc.invalidateQueries({ queryKey: ["positions"] }); } });
}
