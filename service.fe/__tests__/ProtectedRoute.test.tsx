import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { ProtectedRoute } from "../src/routes/ProtectedRoute";
import { UserRole, type UserProfile } from "../src/types/permissions";

/**
 * O `role` do `ProtectedRoute` compara por igualdade EXATA. Quando a gestão de
 * utilizadores se mudou para dentro do grupo do corpo clínico, as contas de
 * `admin` deixaram de passar — e como a barra lateral só lhes mostra páginas
 * desse grupo, um administrador ficava sem plataforma nenhuma. Pior: era
 * reencaminhado para uma rota que não existia e via um 404.
 *
 * Estes testes prendem as duas metades: `roles` aceita mais do que um papel, e
 * quem não tem perfil vai parar a uma página que existe.
 */

const perfil = (role: UserRole): UserProfile =>
  ({
    idUser: "u1",
    nome: "Teste",
    email: "teste@example.com",
    role,
    xp: 0,
    nivel: 1,
    streakAtual: 0,
    urlFotoPerfil: null,
    permissions: [],
  }) as UserProfile;

const mockUseUser = vi.hoisted(() => vi.fn());

vi.mock("../src/contexts/UserContext", () => ({
  useUser: mockUseUser,
}));

const renderComPapel = (
  papelDoUtilizador: UserRole,
  props: { role?: UserRole; roles?: UserRole[] },
) => {
  mockUseUser.mockReturnValue({
    isAuthenticated: true,
    isLoading: false,
    permissions: [],
    user: perfil(papelDoUtilizador),
  });

  return render(
    <MemoryRouter initialEntries={["/protegida"]}>
      <Routes>
        <Route element={<ProtectedRoute {...props} />}>
          <Route path="/protegida" element={<p>conteúdo protegido</p>} />
        </Route>
        <Route path="/sem-autorizacao" element={<p>sem autorização</p>} />
        <Route path="*" element={<p>página não encontrada</p>} />
      </Routes>
    </MemoryRouter>,
  );
};

describe("ProtectedRoute", () => {
  it("deixa passar o papel indicado em `role`", () => {
    renderComPapel(UserRole.CORPO_CLINICO, { role: UserRole.CORPO_CLINICO });
    expect(screen.getByText("conteúdo protegido")).toBeInTheDocument();
  });

  it("deixa passar qualquer um dos papéis indicados em `roles`", () => {
    renderComPapel(UserRole.ADMIN, {
      roles: [UserRole.CORPO_CLINICO, UserRole.ADMIN],
    });
    expect(screen.getByText("conteúdo protegido")).toBeInTheDocument();
  });

  it("um admin não entra num ecrã que é só do corpo clínico", () => {
    renderComPapel(UserRole.ADMIN, { role: UserRole.CORPO_CLINICO });
    expect(screen.queryByText("conteúdo protegido")).not.toBeInTheDocument();
  });

  it("quem não tem perfil vai para uma página que existe, não para o 404", () => {
    renderComPapel(UserRole.PACIENTE, { role: UserRole.CORPO_CLINICO });
    expect(screen.getByText("sem autorização")).toBeInTheDocument();
    expect(screen.queryByText("página não encontrada")).not.toBeInTheDocument();
  });
});
