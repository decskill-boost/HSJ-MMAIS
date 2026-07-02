import { beforeEach, describe, expect, it } from "vitest";
import {
  clearStoredAuth,
  loadStoredAuth,
  persistAuthState,
} from "../src/services/authPersistence";

describe("auth persistence", () => {
  beforeEach(() => {
    window.localStorage.removeItem("hsjmaais.auth.v1");
  });

  it("guarda e restaura o estado de autenticação no localStorage", () => {
    const payload = {
      accessToken: "token-123",
      expiresAt: 1710000000,
      user: {
        idUser: "user-1",
        nome: "Ana",
        email: "ana@example.com",
        role: "paciente" as const,
        xp: 10,
        nivel: 2,
        streakAtual: 3,
        urlFotoPerfil: null,
        permissions: [],
      },
    };

    persistAuthState(payload);

    expect(loadStoredAuth()).toEqual(payload);
  });

  it("limpa o estado guardado", () => {
    persistAuthState({
      accessToken: "token-123",
      expiresAt: 1710000000,
      user: null,
    });

    clearStoredAuth();

    expect(loadStoredAuth()).toBeNull();
  });
});
