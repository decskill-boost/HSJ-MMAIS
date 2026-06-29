import axios from "axios";

// O Vite vai ler isto dinamicamente:
// No  PC lê o .env.local, na Vercel lê as variáveis online!
const API_URL = import.meta.env.VITE_API_URL;

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});
