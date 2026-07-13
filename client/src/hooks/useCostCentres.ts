import { useQuery } from "@tanstack/react-query";
import { listCostCentres } from "../api/costCentres";
export function useCostCentres() { return useQuery({ queryKey: ["costCentres"] as const, queryFn: listCostCentres }); }
