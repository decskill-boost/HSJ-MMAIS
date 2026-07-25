import axios from "axios";

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
