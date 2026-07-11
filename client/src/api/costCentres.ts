import { api } from "./client";
import type { CostCentre } from "../types/models";
export function listCostCentres(): Promise<CostCentre[]> { return api.get<CostCentre[]>("/api/cost-centres"); }
