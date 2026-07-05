import { api } from "./client";
import type { MrfTemplate } from "../types/models";
export function listTemplatesByCostCentre(costCentre: string): Promise<MrfTemplate[]> { return api.get<MrfTemplate[]>(`/api/mrf-templates?costCentre=${encodeURIComponent(costCentre)}`); }
