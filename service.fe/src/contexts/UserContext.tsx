/* eslint-disable react-refresh/only-export-components */

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ApiError, fetchCurrentUser } from "../lib/api";
import {
  clearStoredAuth,
  loadStoredAuth,
  persistAuthState,
} from "../services/authPersistence";
import { supabase } from "../services/supabaseClient";
import type { Permission, UserProfile } from "../types/permissions";

interface UserContextValue {
  user: UserProfile | null;
  permissions: Permission[];
  isLoading: boolean;
  isAuthenticated: boolean;
}

const UserContext = createContext<UserContextValue>({
  user: null,
  permissions: [],
  isLoading: true,
  isAuthenticated: false,
});

// Só limpamos a sessão local quando o backend confirma que o token
// é inválido/expirado (401/403). Qualquer outra falha (rede, backend
// em baixo, 500, etc.) mantém a sessão local para não deslogar o
// utilizador por um problema temporário de infraestrutura.
function shouldClearSession(err: unknown): boolean {
  return err instanceof ApiError && (err.status === 401 || err.status === 403);
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Usamos um ref porque o valor precisa de estar sempre atualizado
  // dentro do listener onAuthStateChange, sem recriar o listener.
  const userRef = useRef<UserProfile | null>(null);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    let isInitialLoadDone = false;

    async function loadAndPersistProfile(
      accessToken: string,
      expiresAt: number | null,
    ) {
      try {
        const profile = await fetchCurrentUser(accessToken);
        setUser(profile);
        userRef.current = profile;
        persistAuthState({
          accessToken,
          expiresAt,
          user: profile,
        });
      } catch (err) {
        console.error("[UserContext] falha ao obter perfil do backend", err);
        if (shouldClearSession(err)) {
          setUser(null);
          userRef.current = null;
          clearStoredAuth();
        } else {
          console.warn(
            "[UserContext] backend indisponível, a manter sessão local existente",
          );
        }
      }
    }

    async function loadUser() {
      console.log("[UserContext] a iniciar carregamento de utilizador");
      const storedAuth = loadStoredAuth();
      if (storedAuth?.accessToken && storedAuth.user) {
        console.log(
          "[UserContext] utilizador restaurado do storage",
          storedAuth.user.email,
        );
        setUser(storedAuth.user);
        userRef.current = storedAuth.user;
        setIsLoading(false);
        isInitialLoadDone = true;
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      console.log("[UserContext] sessão obtida do Supabase", {
        hasToken: Boolean(session?.access_token),
        expiresAt: session?.expires_at,
      });

      if (session?.access_token) {
        await loadAndPersistProfile(
          session.access_token,
          session.expires_at ?? null,
        );
      } else {
        console.log("[UserContext] sem sessão válida no Supabase");
        setUser(null);
        userRef.current = null;
      }

      setIsLoading(false);
      isInitialLoadDone = true;
    }

    void loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log("[UserContext] auth state change", {
        event: _event,
        hasToken: Boolean(session?.access_token),
      });

      // O Supabase dispara INITIAL_SESSION ao montar a página. Se já
      // temos o utilizador (restaurado do storage ou já carregado),
      // não vale a pena repetir o pedido ao backend aqui - evita
      // limpar uma sessão válida por causa de uma falha
      // pontual/redundante desta segunda chamada.
      if (_event === "INITIAL_SESSION" && userRef.current) {
        console.log(
          "[UserContext] INITIAL_SESSION ignorado, utilizador já carregado",
        );
        return;
      }

      if (session?.access_token) {
        await loadAndPersistProfile(
          session.access_token,
          session.expires_at ?? null,
        );
      } else {
        console.log("[UserContext] sessão removida no auth state change");
        setUser(null);
        userRef.current = null;
        clearStoredAuth();
      }

      if (!isInitialLoadDone) {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <UserContext.Provider
      value={{
        user,
        permissions: user?.permissions ?? [],
        isLoading,
        isAuthenticated: user !== null,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
