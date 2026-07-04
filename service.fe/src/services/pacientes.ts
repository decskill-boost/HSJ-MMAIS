import { supabase } from "./supabaseClient";

export interface Paciente {
  id_user: string;
  nome: string;
  email: string;
}

export const pacientesService = {
  // Busca todos os utilizadores que são pacientes
  async getPacientes(): Promise<Paciente[]> {
    const { data, error } = await supabase
      .from("utilizadores")
      .select("id_user, nome, email")
      .eq("tipo_utilizador", "paciente")
      .order("nome", { ascending: true });

    if (error) {
      console.error("Erro ao carregar pacientes:", error.message);
      throw new Error(error.message);
    }

    return data ?? [];
  },
};