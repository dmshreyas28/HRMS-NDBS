import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "./useApi";
import { listTemplatesByCostCentre } from "../api/templates";
export function useTemplatesByCostCentre(costCentre: string | null | undefined) {
  return useQuery({ queryKey: queryKeys.templates(costCentre ?? ""), queryFn: () => listTemplatesByCostCentre(costCentre!), enabled: !!costCentre });
}
