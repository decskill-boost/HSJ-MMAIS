import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Session } from "@supabase/supabase-js";
import type { UserProfile } from "../src/types/user";

const { authService, obterPerfil } = vi.hoisted(() => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn(),
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
  },
  obterPerfil: vi.fn(),
}));

vi.mock("../src/services/Auth", () => ({ authService }));
vi.mock("../src/services/userService", () => ({ obterPerfil }));

const { useSessao } = await import("../src/hooks/useSessao");

const sessao = { user: { id: "uid-1" } } as Session;

const perfil: UserProfile = {
  id_user: "uid-1",
  nome: "Rita",
  email: "rita@ulssaojoao.min-saude.pt",
  tipo_utilizador: "corpo_clinico",
  xp: 0,
  nivel: 1,
  streak_atual: 0,
  data_registo: "2026-01-15T12:00:00Z",
};

describe("useSessao", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authService.onAuthStateChange.mockReturnValue(() => {});
    obterPerfil.mockResolvedValue(perfil);
  });

  it("restaura a sessão guardada e carrega o perfil", async () => {
    authService.getSession.mockResolvedValue(sessao);

    const { result } = renderHook(() => useSessao());

    await waitFor(() => expect(result.current.aCarregar).toBe(false));
    expect(result.current.user).toEqual(perfil);
  });

  it("termina o carregamento sem utilizador quando não há sessão", async () => {
    authService.getSession.mockResolvedValue(null);

    const { result } = renderHook(() => useSessao());

    await waitFor(() => expect(result.current.aCarregar).toBe(false));
    expect(result.current.user).toBeNull();
    expect(obterPerfil).not.toHaveBeenCalled();
  });

  it("não fica preso a carregar se o Supabase falhar", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    authService.getSession.mockRejectedValue(new Error("offline"));

    const { result } = renderHook(() => useSessao());

    await waitFor(() => expect(result.current.aCarregar).toBe(false));
    expect(result.current.user).toBeNull();
  });

  it("terminarSessao fecha a sessão no Supabase e limpa o utilizador", async () => {
    authService.getSession.mockResolvedValue(sessao);
    authService.logout.mockResolvedValue(undefined);

    const { result } = renderHook(() => useSessao());
    await waitFor(() => expect(result.current.user).toEqual(perfil));

    await act(() => result.current.terminarSessao());

    expect(authService.logout).toHaveBeenCalledTimes(1);
    expect(result.current.user).toBeNull();
  });

  it("relê o perfil quando o utilizador da sessão muda", async () => {
    authService.getSession.mockResolvedValue(null);
    let notifica: ((s: Session | null) => void) | undefined;
    authService.onAuthStateChange.mockImplementation(
      (aoMudar: (s: Session | null) => void) => {
        notifica = aoMudar;
        return () => {};
      },
    );

    const { result } = renderHook(() => useSessao());
    await waitFor(() => expect(result.current.aCarregar).toBe(false));

    await act(async () => {
      notifica?.(sessao);
      await Promise.resolve();
    });

    await waitFor(() => expect(result.current.user).toEqual(perfil));
    expect(obterPerfil).toHaveBeenCalledTimes(1);
  });

  it("cancela a subscrição ao desmontar", async () => {
    const cancelar = vi.fn();
    authService.getSession.mockResolvedValue(null);
    authService.onAuthStateChange.mockReturnValue(cancelar);

    const { result, unmount } = renderHook(() => useSessao());
    await waitFor(() => expect(result.current.aCarregar).toBe(false));

    unmount();
    expect(cancelar).toHaveBeenCalledTimes(1);
  });
});
