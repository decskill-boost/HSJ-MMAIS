import { Suspense, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import CarregandoAcademia from "../components/CarregandoAcademia";
import Footer from "../components/Footer";
import Sidebar, {
  IconeInicio,
  IconeBiblioteca,
  IconePlano,
  IconePlanos,
  type SidebarLink,
} from "../components/Sidebar";
import { useAuthActions } from "../hooks/useAuthActions";

const linksAdmin: SidebarLink[] = [
  {
    to: "/dashboard/admin",
    label: "Gestão de Utilizadores",
    Icon: IconePlano,
    end: true,
  },
];

const linksMedico: SidebarLink[] = [
  { to: "/dashboard/medico", label: "Início", Icon: IconeInicio, end: true },
  {
    to: "/dashboard/medico/pacientes",
    label: "Gerir Planos",
    Icon: IconePlanos,
  },
  {
    to: "/exercicios",
    label: "Biblioteca de Exercícios",
    Icon: IconeBiblioteca,
  },
  { to: "/plano/criar", label: "Criar Plano", Icon: IconePlano },
];

const linksPaciente: SidebarLink[] = [
  { to: "/dashboard/paciente", label: "Início", Icon: IconeInicio, end: true },
  { to: "/paciente/planos", label: "Ver Planos", Icon: IconePlanos },
];

// Páginas onde a sidebar NÃO deve aparecer
const paginasSemSidebar = ["/", "/login", "/missao"];

export const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, handleLogin, handleLogout } = useAuthActions();

  // Estado do menu mobile (hamburger + sidebar flutuante)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Escolhe os links da sidebar conforme o tipo de utilizador
  const isClinico = user?.role === "corpo_clinico";
  const isPaciente = user?.role === "paciente";
  const isAdmin = user?.role === "admin";

  const linksDoUtilizador = isAdmin
    ? linksAdmin
    : isClinico
      ? linksMedico
      : isPaciente
        ? linksPaciente
        : null;

  // Só mostra a sidebar se houver links E a página atual não estiver na lista de exceções
  const mostrarSidebar =
    linksDoUtilizador && !paginasSemSidebar.includes(location.pathname);

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* 1. COLUNA ESQUERDA: Sidebar ocupa a altura inteira */}
      {mostrarSidebar && (
        <Sidebar
          links={linksDoUtilizador}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      )}

      {/* 2. COLUNA DIREITA: Navbar, Main Content e Footer empilhados */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar
          user={user}
          onLoginClick={() => navigate("/login")}
          onLogoutClick={handleLogout}
          isMenuOpen={isSidebarOpen}
          onMenuToggle={() => setIsSidebarOpen((prev) => !prev)}
        />

        <main className="flex-1 overflow-y-auto pb-16">
          <Suspense fallback={<CarregandoAcademia />}>
            <Outlet context={{ user, handleLogin, handleLogout }} />
          </Suspense>
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default Layout;