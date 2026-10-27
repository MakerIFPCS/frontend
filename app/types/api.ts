export interface CreateUserRequest {
  name: string;
  password: string;
  email: string;
  cpf: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  tokenType: string;
  userId: number;
  role: string;
  userName: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  cellphone: string | null;
  cpf: string;
  type: string;
  birthDate: string | null;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface MaterialAPI {
  id: number;
  name: string;
  description: string;
  quantity: number;
  unit: string;
  createdAt: string;
  updatedAt: string;
}

export interface MaterialPayload {
  name: string;
  description: string;
  quantity: number;
  unit: string;
}

export type MachineStatusAPI = 'FUNCTIONAL' | 'AVAILABLE' | 'MAINTENANCE' | 'UNUSABLE';

export interface MachineAPI {
  id: number;
  name: string;
  description: string;
  status: MachineStatusAPI;
  access: 'FREE' | 'RESTRICTED';
  code: string | null;
  type: string | null;
  image: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MachinePayload {
  name: string;
  description: string;
  status: MachineStatusAPI;
  code: string;
  type: string;
  image: string;
  access: 'FREE' | 'RESTRICTED';
}

export interface SchedulingRequestAPI {
  id: number;
  code: string;
  requesterName: string;
  requesterType: string;
  course?: string;
  email: string;
  registrationNumber: string;
  date: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  purpose: string;
  reason: string;
  description: string;
  equipment: string[];
  status: string;
  workstation?: string;
  adminNotes?: string;
  rejectionReason?: string;
  decidedAt?: string;
  decidedBy?: string;
  createdAt: string;
}

export type SchedulingRequestPayload = Omit<SchedulingRequestAPI, 'id' | 'createdAt'>;

export type LoanResourceType = 'MACHINE' | 'MATERIAL';
export type LoanRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface LoanRequestItemPayload {
  type: LoanResourceType;
  resourceId: number;
  quantity: number;
}

export interface CreateLoanRequestPayload {
  items: LoanRequestItemPayload[];
  pickupDate: string;
  returnDate: string;
  reason: string;
}

export interface LoanRequestItemAPI extends LoanRequestItemPayload {
  name: string;
}

export interface LoanRequestAPI {
  id: number;
  requesterName: string;
  requesterEmail: string;
  items: LoanRequestItemAPI[];
  pickupDate: string;
  returnDate: string;
  reason: string;
  status: LoanRequestStatus;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateLoanRequestStatusPayload {
  status: Exclude<LoanRequestStatus, 'PENDING'>;
  adminNotes?: string;
}

export interface ActivityReportEventAPI {
  occurredAt: string;
  category: string;
  action: string;
  subject: string;
  actor: string;
  details: string | null;
}

export interface ActivityReportAPI {
  generatedAt: string;
  fromDate: string | null;
  untilDate: string | null;
  events: ActivityReportEventAPI[];
}
