export type PositionType = "NEW_HIRE" | "REPLACEMENT";
export type PositionStatus = "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "ON_HOLD" | "POSTED" | "FILLED" | "COLLAPSED";
export type UserRole = "HM" | "HR_TA" | "Admin";

export interface SalaryRange { min: number; max: number; currency: string; }
export interface AuditLogEntry { action: string; actorId: string; timestamp: string; fromStatus: string; toStatus: string; notes: string; }

export interface ReplacementDetails {
  exEmployeeId: string;
  exEmployeeName: string;
  exEmployeeEmail: string;
  exEmployeePhone: string;
  bu: string;
  department: string;
  lastSalary: number;
  reasonForLeaving: string;
  colourCode: "GREEN" | "RED" | "BLACK";
}

export interface OnHoldDetails {
  isOnHold: boolean;
  heldAt: string | null;
  expiresAt: string | null;
}

export interface Position {
  id: string; positionType: PositionType; status: PositionStatus; costCentre: string; jobCode: string; division: string;
  jobTitle: string; reportingManager: string; jd: string; requiredSkills: string[]; salaryRange: SalaryRange;
  requiredStartDate: string; shiftTime: string; shiftDays: string[]; location: string; experienceLevel: string;
  impactIfUnfilled: string; sittingPlace: string; raisedBy: string; reviewerId: string | null;
  approvalSkipped: boolean; approvalSkippedReason: string | null; mrfTemplateId: string;
  jobPostedAt: string | null; filledAt: string | null; collapsedAt: string | null;
  lastHMActionAt: string; auditLog: AuditLogEntry[]; createdAt: string; updatedAt: string;
  replacementDetails?: ReplacementDetails;
  reviewerEmailDraft?: string;
  reviewerEmailSent?: boolean;
  onHold: OnHoldDetails;
  raisedByName?: string;
}

export interface MrfTemplate {
  id: string; costCentre: string; name: string; jobTitle: string; jdSkeleton: string;
  requiredSkills: string[]; salaryRange: { min: number; max: number }; isActive: boolean; createdAt: string;
}

export interface CostCentre { id: string; code: string; name: string; department: string; isActive: boolean; }
export interface AppUser { id: string; auth0Id: string; name: string; email: string; role: UserRole; costCentre: string | null; department: string | null; isActive: boolean; }
export interface ApiResponse<T> { success: boolean; data: T | null; error: string | null; }
