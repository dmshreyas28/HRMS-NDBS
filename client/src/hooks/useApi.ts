export const queryKeys = {
  positions: (status?: string) => ["positions", status ?? "all"] as const,
  position: (id: string) => ["position", id] as const,
  auditTrail: (id: string) => ["audit", id] as const,
  templates: (costCentre: string) => ["templates", costCentre] as const,
  costCentres: ["costCentres"] as const,
};
