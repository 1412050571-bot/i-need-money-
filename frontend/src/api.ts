import axios from 'axios';

export type TaskStatus = 'TODO' | 'DOING' | 'DONE' | 'ARCHIVED';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Project {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
}

export interface Task {
  id: number;
  projectId: number;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  dueAt?: string;
  remindAt?: string;
  tags: string[];
  archived: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

const baseURL = (import.meta as any).env?.VITE_API_BASE || '/api';
const client = axios.create({ baseURL });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function listProjects() {
  const { data } = await client.get<Project[]>('/projects');
  return data;
}

export async function createProject(payload: { name: string; description?: string }) {
  const { data } = await client.post<Project>('/projects', payload);
  return data;
}

export interface TaskQuery {
  keyword?: string;
  status?: TaskStatus;
  tags?: string[];
  page?: number;
  size?: number;
  sort?: string;
}

export async function listTasks(projectId: number, query: TaskQuery) {
  const { data } = await client.get<Page<Task>>(`/projects/${projectId}/tasks`, { params: query });
  return data;
}

export async function createTask(projectId: number, payload: Partial<Task>) {
  const { data } = await client.post<Task>(`/projects/${projectId}/tasks`, payload);
  return data;
}

export async function updateTask(taskId: number, payload: Partial<Task>) {
  const { data } = await client.put<Task>(`/tasks/${taskId}`, payload);
  return data;
}

export async function archiveTask(taskId: number) {
  await client.post(`/tasks/${taskId}/archive`);
}

export async function deleteTask(taskId: number) {
  await client.delete(`/tasks/${taskId}`);
}

export async function clearDatabase() {
  await client.delete('/admin/clear');
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    email: string;
    displayName: string;
    avatarUrl?: string;
    role: string;
  };
}

export async function login(payload: { email: string; password: string }) {
  const { data } = await client.post<LoginResponse>('/auth/login', payload);
  localStorage.setItem('auth_token', data.token);
  return data;
}

export async function register(payload: { email: string; password: string; code: string }) {
  const { data } = await client.post<LoginResponse['user']>('/auth/register', payload);
  return data;
}

export async function sendCode(email: string) {
  await client.post('/auth/send-code', null, { params: { email } });
}

export async function fetchMe() {
  const { data } = await client.get<LoginResponse['user']>('/auth/me');
  return data;
}

export async function updateProfile(payload: { displayName: string; avatarUrl?: string }) {
  const { data } = await client.put<LoginResponse['user']>('/auth/me', payload);
  return data;
}

export function logout() {
  localStorage.removeItem('auth_token');
}
