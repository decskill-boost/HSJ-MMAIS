import { Outlet, useNavigate } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import Footer from "../components/Footer";
import { useSessao } from "../hooks/useSessao";
import type { LayoutContext } from "./layoutContext";

export const Layout = () => {
  const { user, aCarregar, terminarSessao } = useSessao();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await terminarSessao();
    } catch (erro: unknown) {
      // Mesmo que o Supabase falhe, tiramos o utilizador daqui: mais vale
      // voltar ao início do que ficar num ecrã que já não lhe pertence.
      console.warn("[sessão] falha ao terminar sessão:", erro);
    } finally {
      navigate("/");
    }
  };

  const contexto: LayoutContext = { user, aCarregar };

  return (
    <div className="relative flex min-h-screen flex-col">
      <a
        href="#conteudo"
        className="painel sr-only px-4 py-2 font-bold text-tinta focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50"
      >
        Saltar para o conteúdo
      </a>
      <Navbar
        user={user}
        onLoginClick={() => navigate("/login")}
        onLogoutClick={handleLogout}
      />
      <main id="conteudo" className="flex flex-1 flex-col">
        {/* O Outlet é onde o React Router injeta as páginas (Welcome, Login, Perfil) */}
        <Outlet context={contexto} />
      </main>
      <Footer />
    </div>
  );
};
