import { supabase } from "./supabaseClient";
import { clearStoredAuth, persistAuthState } from "./authPersistence";
import type { LoginCredentials } from "../types/auth.types";
import type { UserProfile } from "../types/permissions";

export const authService = {
  async login({ email, password }: LoginCredentials) {
    console.log("[Auth] a tentar login no Supabase", { email });

    // 1. Faz o login no Supabase (Auth)
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (authError) throw new Error(authError.message);

    // 2. Tentar contactar o backend NestJS (Health Check / Fetch Profil)
    try {
      const token = authData.session?.access_token;

      // Ajusta o URL dinamicamente usando a variável de ambiente do Vercel/Vite
      const backendResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/users/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (!backendResponse.ok) {
        throw new Error(
          "O servidor backend não está a responder corretamente.",
        );
      }

      // Se quiseres podes até usar o perfil retornado pelo teu NestJS aqui,
      // mas mantive a tua lógica de ir buscar ao Supabase para não quebrar os teus tipos.
      const { data: profile, error: profileError } = await supabase
        .from("utilizadores")
        .select("*")
        .eq("id_user", authData.user.id)
        .single();

      if (profileError) throw new Error(profileError.message);

      const normalizedProfile: UserProfile = {
        idUser: profile.id_user,
        nome: profile.nome,
        email: profile.email,
        role: profile.tipo_utilizador,
        xp: profile.xp,
        nivel: profile.nivel,
        streakAtual: profile.streak_atual,
        urlFotoPerfil: profile.url_foto_perfil ?? null,
        permissions: [],
        id_user: profile.id_user,
        tipo_utilizador: profile.tipo_utilizador,
        streak_atual: profile.streak_atual,
        data_registo: profile.data_registo,
        url_foto_perfil: profile.url_foto_perfil ?? null,
      };

      persistAuthState({
        accessToken: authData.session?.access_token ?? null,
        expiresAt: authData.session?.expires_at ?? null,
        user: normalizedProfile,
      });

      return normalizedProfile;
    } catch (backendError) {
      // 3. SE O NESTJS ESTIVER EM BAIXO (ou der erro), anulamos o login!
      console.error("[Auth] O backend NestJS está indisponível:", backendError);

      // Limpamos a sessão recém-criada no Supabase
      await supabase.auth.signOut();
      clearStoredAuth();

      // Lançamos o erro e passamos o erro original como "cause"
      throw new Error(
        "O sistema está temporariamente indisponível. Tente mais tarde.",
        {
          cause: backendError,
        },
      );
    }
  },

  async logout() {
    console.log("[Auth] a terminar sessão");
    await supabase.auth.signOut();
    clearStoredAuth();
  },
};
