import axios from 'axios';
import type {
  CreateUserRequest,
  LoginRequest,
  LoginResponse,
  MachineAPI,
  MachinePayload,
  SchedulingRequestAPI,
  SchedulingRequestPayload,
  User,
} from '@/app/types/api';

export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8081/api').replace(/\/+$/, '');
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('authToken');
    if (token) config.headers.Authorization = token;
  }
  return config;
});

export async function createUser(payload: CreateUserRequest): Promise<User> {
  const response = await api.post<User>('/users', payload);
  return response.data;
}

export async function loginUser(payload: LoginRequest): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>('/auth/login', payload);
  return response.data;
}

export async function getUser(id: string): Promise<User> {
  const response = await api.get<User>(`/users/${id}`);
  return response.data;
}

export async function getUsers(): Promise<User[]> {
  const response = await api.get<User[]>('/users');
  return response.data;
}

export async function promoteUserToAdmin(id: number): Promise<User> {
  const response = await api.patch<User>(`/users/${id}/promote-to-admin`);
  return response.data;
}

export async function getMachines(): Promise<MachineAPI[]> {
  const response = await api.get<MachineAPI[]>('/machines');
  return response.data;
}

export async function createMachine(payload: MachinePayload): Promise<MachineAPI> {
  const response = await api.post<MachineAPI>('/machines', payload);
  return response.data;
}

export async function updateMachine(id: string, payload: MachinePayload): Promise<MachineAPI> {
  const response = await api.put<MachineAPI>(`/machines/${id}`, payload);
  return response.data;
}

export async function deleteMachine(id: string): Promise<void> {
  await api.delete(`/machines/${id}`);
}

export async function getSchedulingRequests(): Promise<SchedulingRequestAPI[]> {
  const response = await api.get<SchedulingRequestAPI[]>('/agendamentos');
  return response.data;
}

export async function createSchedulingRequest(payload: SchedulingRequestPayload): Promise<SchedulingRequestAPI> {
  const response = await api.post<SchedulingRequestAPI>('/agendamentos', payload);
  return response.data;
}

export async function updateSchedulingRequest(
  id: string,
  payload: SchedulingRequestPayload,
): Promise<SchedulingRequestAPI> {
  const response = await api.put<SchedulingRequestAPI>(`/agendamentos/${id}`, payload);
  return response.data;
}

export async function deleteSchedulingRequest(id: string): Promise<void> {
  await api.delete(`/agendamentos/${id}`);
}
