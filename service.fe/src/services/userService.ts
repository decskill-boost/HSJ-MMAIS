import { apiClient } from "./apiClient";
import { supabase } from "./supabaseClient";
import type { UserProfile } from "../types/permissions";

async function getAccessToken(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Sessão inválida. Por favor, faça login novamente.");
  }

  return session.access_token;
}

export async function fetchUsers(): Promise<UserProfile[]> {
  const token = await getAccessToken();
  const response = await apiClient.get<UserProfile[]>("/users", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

export interface CreateUserPayload {
  nome: string;
  email: string;
  password: string;
  tipo_utilizador: string;
}

export async function createUser(payload: CreateUserPayload) {
  const token = await getAccessToken();
  const response = await apiClient.post("/users", payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data as UserProfile;
}

export interface UpdateUserPayload {
  nome?: string;
  email?: string;
  tipo_utilizador?: string;
}

export async function updateUser(id: string, payload: UpdateUserPayload) {
  const token = await getAccessToken();
  const response = await apiClient.put(`/users/${id}`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data as UserProfile;
}

export async function disableUser(id: string) {
  const token = await getAccessToken();
  const response = await apiClient.delete(`/users/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}
