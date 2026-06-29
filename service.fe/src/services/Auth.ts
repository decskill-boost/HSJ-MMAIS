import { supabase } from "./supabaseClient";
import type { LoginCredentials } from "../types/auth.types";

export const authService = {
  async login({ email, password }: LoginCredentials) {
    // 1. Faz o login no Auth do Supabase
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (authError) throw new Error(authError.message);

    // 2. Vai buscar logo o perfil do utilizador à tabela pública
    const { data: profile, error: profileError } = await supabase
      .from("utilizadores")
      .select("*")
      .eq("id_user", authData.user.id)
      .single();

    if (profileError) throw new Error(profileError.message);

    // Retorna o perfil completo (com o tipo_utilizador incluído)
    return profile;
  },
};
