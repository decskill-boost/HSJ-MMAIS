import { supabase } from "./supabaseClient";
import type { LoginCredentials } from "../types/auth.types";
import type { Session } from "@supabase/supabase-js";

export const authService = {
  async login({ email, password }: LoginCredentials) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  /**
   * Termina a sessão no Supabase. Sem isto o token continua em localStorage —
   * num tablet partilhado, o utilizador seguinte herdava a sessão anterior.
   */
  async logout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw new Error(error.message);
    }
  },

  /** Sessão que o Supabase já tem guardada — permite sobreviver a um refresh. */
  async getSession(): Promise<Session | null> {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      throw new Error(error.message);
    }

    return data.session;
  },

  /**
   * Acompanha login, logout e renovação de token.
   * Devolve a função que cancela a subscrição.
   */
  onAuthStateChange(aoMudar: (session: Session | null) => void) {
    const { data } = supabase.auth.onAuthStateChange((_evento, session) =>
      aoMudar(session),
    );

    return () => data.subscription.unsubscribe();
  },
};
