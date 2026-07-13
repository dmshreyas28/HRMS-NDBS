import { useQuery } from "@tanstack/react-query";
import { listTemplatesByCostCentre } from "../api/templates";
export function useTemplatesByCostCentre(costCentre: string | null | undefined) {
  return useQuery({
    queryKey: ["templates", costCentre ?? ""] as const,
    queryFn: () => listTemplatesByCostCentre(costCentre || ""),
  });
}
