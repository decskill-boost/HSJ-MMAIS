import { supabase } from "./supabaseClient";
import { clearStoredAuth, persistAuthState } from "./authPersistence";
import type { LoginCredentials } from "../types/auth.types";
import type { UserProfile } from "../types/permissions";

// O Supabase devolve os erros de autenticação em inglês técnico e essa mensagem
// chegava tal e qual ao ecrã de login. Traduzimos os casos conhecidos e dizemos
// o passo seguinte; tudo o resto cai na mensagem genérica.
const MENSAGENS_ERRO_LOGIN: Record<string, string> = {
  invalid_credentials:
    "Email ou palavra-passe incorretos. Confirme os dados e tente novamente.",
  email_not_confirmed:
    "Esta conta ainda não foi confirmada. Abra o email de confirmação que lhe enviámos e siga a ligação.",
  user_not_found:
    "Não existe nenhuma conta com este email. Confirme o endereço ou peça ajuda a um administrador.",
  email_address_invalid:
    "O email indicado não é válido. Reveja o endereço e tente novamente.",
  user_banned:
    "Esta conta está suspensa. Contacte um administrador para a reativar.",
  over_request_rate_limit:
    "Demasiadas tentativas seguidas. Aguarde um minuto e tente novamente.",
  validation_failed: "Preencha o email e a palavra-passe para poder entrar.",
};

const MENSAGEM_ERRO_LOGIN_GENERICA =
  "Não foi possível iniciar sessão. Confirme os dados e tente novamente ou contacte um administrador.";

// Nem todos os erros do Supabase trazem `code`, por isso quando ele falta (ou
// não é um dos que conhecemos) identificamos o erro pela mensagem original.
const CODIGOS_POR_MENSAGEM: Record<string, string> = {
  "invalid login credentials": "invalid_credentials",
  "email not confirmed": "email_not_confirmed",
  "user not found": "user_not_found",
  "email rate limit exceeded": "over_request_rate_limit",
};

const traduzErroLogin = (erro: {
  code?: string | undefined;
  message: string;
}): string => {
  const codigo =
    erro.code && MENSAGENS_ERRO_LOGIN[erro.code]
      ? erro.code
      : CODIGOS_POR_MENSAGEM[erro.message.trim().toLowerCase()];

  return (
    (codigo ? MENSAGENS_ERRO_LOGIN[codigo] : undefined) ??
    MENSAGEM_ERRO_LOGIN_GENERICA
  );
};

export const authService = {
  async login({ email, password }: LoginCredentials) {
    console.log("[Auth] a tentar login no Supabase", { email });

    // 1. Faz o login no Supabase (Auth)
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    // Guardamos o erro original em `cause` para continuar a ser diagnosticável,
    // mas quem está no ecrã vê a versão traduzida.
    if (authError)
      throw new Error(traduzErroLogin(authError), { cause: authError });

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
        entityId: profile.entity_id,
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
