import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "./useApi";
import { listCostCentres } from "../api/costCentres";
export function useCostCentres() { return useQuery({ queryKey: queryKeys.costCentres, queryFn: listCostCentres }); }
