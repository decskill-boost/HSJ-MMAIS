import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "@supabase/supabase-js";

const { maybeSingle } = vi.hoisted(() => ({ maybeSingle: vi.fn() }));

vi.mock("../src/services/supabaseClient", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle }),
      }),
    }),
  },
}));

const { obterPerfil, perfilDaSessao } = await import("../src/services/userService");

const utilizador = {
  id: "uid-1",
  email: "heroi@ulssaojoao.min-saude.pt",
  created_at: "2026-01-15T12:00:00Z",
} as User;

const linha = {
  id_user: "uid-1",
  nome: "Dra. Rita",
  email: "rita@ulssaojoao.min-saude.pt",
  tipo_utilizador: "corpo_clinico",
  xp: 120,
  nivel: 3,
  streak_atual: 7,
  data_registo: "2025-09-01T10:00:00Z",
  url_foto_perfil: null,
};

describe("perfilDaSessao", () => {
  it("usa a parte local do email como nome", () => {
    expect(perfilDaSessao(utilizador)).toMatchObject({
      id_user: "uid-1",
      nome: "heroi",
      email: "heroi@ulssaojoao.min-saude.pt",
      tipo_utilizador: "paciente",
    });
  });
});

describe("obterPerfil", () => {
  beforeEach(() => {
    maybeSingle.mockReset();
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("devolve o perfil da tabela `utilizadores`", async () => {
    maybeSingle.mockResolvedValue({ data: linha, error: null });

    await expect(obterPerfil(utilizador)).resolves.toMatchObject({
      nome: "Dra. Rita",
      tipo_utilizador: "corpo_clinico",
      xp: 120,
      nivel: 3,
      streak_atual: 7,
    });
  });

  it("normaliza um tipo de utilizador desconhecido para paciente", async () => {
    maybeSingle.mockResolvedValue({
      data: { ...linha, tipo_utilizador: "chefe_supremo" },
      error: null,
    });

    await expect(obterPerfil(utilizador)).resolves.toMatchObject({
      tipo_utilizador: "paciente",
    });
  });

  it("cai no perfil da sessão quando a consulta falha", async () => {
    maybeSingle.mockResolvedValue({ data: null, error: { message: "RLS" } });

    await expect(obterPerfil(utilizador)).resolves.toMatchObject({
      nome: "heroi",
      tipo_utilizador: "paciente",
    });
  });

  it("cai no perfil da sessão quando a rede rebenta", async () => {
    maybeSingle.mockRejectedValue(new Error("offline"));

    await expect(obterPerfil(utilizador)).resolves.toMatchObject({
      nome: "heroi",
      tipo_utilizador: "paciente",
    });
  });
});
