import axios from "axios";
import { supabase } from "./supabaseClient";

// O Vite lê isto dinamicamente: no PC vem do .env.local, na Vercel das
// variáveis definidas online. Sem valor definido usa "/api" — em dev é o
// caminho que o proxy do Vite reencaminha para o NestJS.
const API_URL = import.meta.env.VITE_API_URL || "/api";

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Junta o token da sessão a todos os pedidos. Antes só alguns serviços o
 * faziam à mão (sessões e pacientes) e os restantes saíam sem credenciais —
 * o que obrigava o backend a deixar endpoints abertos para funcionarem.
 */
apiClient.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }

  return config;
});
