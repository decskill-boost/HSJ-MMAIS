import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { authService } = vi.hoisted(() => ({
  authService: { login: vi.fn() },
}));

vi.mock("../src/services/Auth", () => ({ authService }));

const { default: Login } = await import("../src/components/Login");

const renderLogin = () =>
  render(
    <MemoryRouter initialEntries={["/login"]}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/perfil" element={<p>ecrã de perfil</p>} />
      </Routes>
    </MemoryRouter>,
  );

const preencherEEnviar = async () => {
  const user = userEvent.setup();
  await user.type(
    screen.getByLabelText(/^email$/i),
    "rita@ulssaojoao.min-saude.pt",
  );
  await user.type(screen.getByLabelText(/palavra-passe/i), "segredo");
  await user.click(screen.getByRole("button", { name: /^entrar$/i }));
};

describe("Login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("apresenta os campos de sessão", () => {
    renderLogin();

    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/palavra-passe/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^entrar$/i }),
    ).toBeInTheDocument();
  });

  it("deixa ver a palavra-passe que se escreveu", async () => {
    const user = userEvent.setup();
    renderLogin();

    const campo = screen.getByLabelText(/palavra-passe/i);
    expect(campo).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: /mostrar/i }));
    expect(campo).toHaveAttribute("type", "text");

    await user.click(screen.getByRole("button", { name: /ocultar/i }));
    expect(campo).toHaveAttribute("type", "password");
  });

  it("anuncia o erro do Supabase e liga-o aos campos", async () => {
    authService.login.mockRejectedValue(new Error("Credenciais inválidas"));

    renderLogin();
    await preencherEEnviar();

    const erro = await screen.findByRole("alert");
    expect(erro).toHaveTextContent(/credenciais inválidas/i);
    expect(screen.getByLabelText(/^email$/i)).toHaveAttribute(
      "aria-describedby",
      erro.id,
    );
    expect(screen.queryByText(/ecrã de perfil/i)).not.toBeInTheDocument();
  });

  it("confirma a sessão e segue para o perfil", async () => {
    authService.login.mockResolvedValue({});

    renderLogin();
    await preencherEEnviar();

    expect(await screen.findByText(/sessão iniciada/i)).toBeInTheDocument();
    expect(authService.login).toHaveBeenCalledWith({
      email: "rita@ulssaojoao.min-saude.pt",
      password: "segredo",
    });

    // A redireção é propositadamente adiada 1,5 s para a mensagem ser lida.
    expect(
      await screen.findByText(/ecrã de perfil/i, undefined, { timeout: 3000 }),
    ).toBeInTheDocument();
  });
});
