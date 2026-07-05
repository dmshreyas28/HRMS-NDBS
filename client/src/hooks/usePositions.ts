import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./useApi";
import { listPositions, getPosition, getAuditTrail, createPosition, updatePosition, submitPosition, approvePosition, rejectPosition, type CreatePositionInput, type UpdatePositionInput } from "../api/positions";
import type { PositionStatus } from "../types/models";

export function usePositions(status?: PositionStatus) {
  return useQuery({ queryKey: queryKeys.positions(status), queryFn: () => listPositions(status) });
}

export function usePosition(id: string | undefined) {
  return useQuery({ queryKey: queryKeys.position(id ?? ""), queryFn: () => getPosition(id!), enabled: !!id });
}

export function useAuditTrail(id: string | undefined) {
  return useQuery({ queryKey: queryKeys.auditTrail(id ?? ""), queryFn: () => getAuditTrail(id!), enabled: !!id });
}

export function useCreateDraft() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (input: CreatePositionInput) => createPosition(input), onSuccess: () => { qc.invalidateQueries({ queryKey: ["positions"] }); } });
}

export function useUpdateDraft(id: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (input: UpdatePositionInput) => updatePosition(id, input), onSuccess: (updated) => { qc.setQueryData(queryKeys.position(id), updated); qc.invalidateQueries({ queryKey: ["positions"] }); } });
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
