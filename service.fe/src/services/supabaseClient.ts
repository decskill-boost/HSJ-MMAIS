import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Falha logo no arranque (ecrã em branco + este erro na consola): sem estas
  // duas variáveis nenhum login funciona. Ver `.env.example`.
  const emFalta = [
    !supabaseUrl && "VITE_SUPABASE_URL",
    !supabaseAnonKey && "VITE_SUPABASE_ANON_KEY",
  ].filter(Boolean);

  throw new Error(
    `Faltam variáveis de ambiente do Supabase em .env.local: ${emFalta.join(", ")}. ` +
      "Copia o .env.example e preenche com os dados de Project Settings > API.",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
