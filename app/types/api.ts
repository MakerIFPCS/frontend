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
