import { useCallback, useEffect, useState } from "react";
import { authService } from "../services/Auth";
import { obterPerfil } from "../services/userService";
import type { Session } from "@supabase/supabase-js";
import type { UserProfile } from "../types/user";

/**
 * Sessão da aplicação. Restaura a sessão que o Supabase já tem guardada — sem
 * isto, um refresh em `/perfil` deitava o utilizador fora — e acompanha
 * login/logout feitos em qualquer separador.
 */
export const useSessao = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [aCarregar, setACarregar] = useState<boolean>(true);

  useEffect(() => {
    let ativo = true;
    // Evita reler o perfil quando só o token foi renovado (mesmo utilizador).
    let idAtual: string | null = null;
    let primeiro = true;
    // `getSession()` e o listener podem chegar por qualquer ordem: só damos o
    // carregamento por terminado quando não há perfis a caminho.
    let pendentes = 0;

    const terminaCarregamento = () => {
      if (ativo && pendentes === 0) {
        setACarregar(false);
      }
    };

    const aplicar = async (session: Session | null) => {
      const idSessao = session?.user?.id ?? null;
      const mudou = primeiro || idSessao !== idAtual;
      idAtual = idSessao;
      primeiro = false;

      if (!mudou) {
        terminaCarregamento();
        return;
      }

      if (!session?.user) {
        if (ativo) setUser(null);
        terminaCarregamento();
        return;
      }

      pendentes += 1;
      try {
        const perfil = await obterPerfil(session.user);
        if (ativo) setUser(perfil);
      } finally {
        pendentes -= 1;
        terminaCarregamento();
      }
    };

    authService
      .getSession()
      .then(aplicar)
      .catch((erro: unknown) => {
        console.warn("[sessão] não foi possível restaurar a sessão:", erro);
        if (ativo) setUser(null);
        terminaCarregamento();
      });

    const cancelar = authService.onAuthStateChange((session) => {
      void aplicar(session);
    });

    return () => {
      ativo = false;
      cancelar();
    };
  }, []);

  const terminarSessao = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  return { user, aCarregar, terminarSessao };
};
