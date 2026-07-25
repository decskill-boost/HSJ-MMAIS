import { render, screen } from "@testing-library/react";
import { MemoryRouter, Outlet, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import PersonalInfo from "../src/components/PersonalInfo/PersonalInfo";
import type { LayoutContext } from "../src/routes/layoutContext";
import type { UserProfile } from "../src/types/user";

const base: UserProfile = {
  id_user: "uid-1",
  nome: "Rita",
  email: "rita@ulssaojoao.min-saude.pt",
  tipo_utilizador: "paciente",
  xp: 120,
  nivel: 3,
  streak_atual: 7,
  data_registo: "2026-01-15T12:00:00Z",
};

const renderPerfil = (contexto: LayoutContext) =>
  render(
    <MemoryRouter initialEntries={["/perfil"]}>
      <Routes>
        <Route element={<Outlet context={contexto} />}>
          <Route path="/perfil" element={<PersonalInfo />} />
          <Route path="/login" element={<p>ecrã de login</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );

describe("PersonalInfo", () => {
  it("espera pela sessão em vez de decidir cedo demais", () => {
    renderPerfil({ user: null, aCarregar: true });

    expect(screen.getByRole("status")).toHaveTextContent(/a carregar/i);
    expect(screen.queryByText(/ecrã de login/i)).not.toBeInTheDocument();
  });

  it("reencaminha para o login quando não há sessão", () => {
    renderPerfil({ user: null, aCarregar: false });

    expect(screen.getByText(/ecrã de login/i)).toBeInTheDocument();
  });

  it("mostra o cartão de herói e as estatísticas do paciente", () => {
    renderPerfil({ user: base, aCarregar: false });

    expect(screen.getByText(/herói em treino · nível 3/i)).toBeInTheDocument();
    expect(screen.getByText("120")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText(/dias seguidos/i)).toBeInTheDocument();
    expect(screen.queryByText(/acesso clínico/i)).not.toBeInTheDocument();
  });

  it("mostra o bloco clínico ao corpo clínico", () => {
    renderPerfil({
      user: { ...base, nome: "Dra. Rita", tipo_utilizador: "corpo_clinico" },
      aCarregar: false,
    });

    expect(
      screen.getByRole("heading", { name: /dra\. rita/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/acesso clínico ativo/i)).toBeInTheDocument();
    expect(screen.getByText("Corpo Clínico")).toBeInTheDocument();
  });

  it("apresenta a data de registo em formato português", () => {
    renderPerfil({ user: base, aCarregar: false });

    expect(screen.getByText("15/01/2026")).toBeInTheDocument();
  });
});
