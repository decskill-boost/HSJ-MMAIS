import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import Footer from "../components/Footer";
import Sidebar, {
  IconeInicio,
  IconeBiblioteca,
  IconePlano,
  IconePlanos,
  type SidebarLink,
} from "../components/Sidebar";
import { useAuthActions } from "../hooks/useAuthActions";

const IconeTrofeu = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M6 9H4a2 2 0 0 1-2-2V5h4" />
    <path d="M18 9h2a2 2 0 0 0 2-2V5h-4" />
    <path d="M12 17v4" />
    <path d="M8 21h8" />
    <rect x="6" y="2" width="12" height="13" rx="2" />
  </svg>
);

const linksAdmin: SidebarLink[] = [
  { to: "/dashboard/admin", label: "Gestão de Utilizadores", Icon: IconePlano, end: true },
];

const linksMedico: SidebarLink[] = [
  { to: "/dashboard/medico", label: "Início", Icon: IconeInicio, end: true },
  { to: "/dashboard/medico/pacientes", label: "Gerir Planos", Icon: IconePlanos },
  { to: "/exercicios", label: "Biblioteca de Exercícios", Icon: IconeBiblioteca },
  { to: "/plano/criar", label: "Criar Plano", Icon: IconePlano },
];

const linksPaciente: SidebarLink[] = [
  { to: "/dashboard/paciente", label: "Início", Icon: IconeInicio, end: true },
  { to: "/paciente/planos", label: "Ver Planos", Icon: IconePlanos },
  { to: "/paciente/historico", label: "Histórico & Prémios", Icon: IconeTrofeu },
];

const paginasSemSidebar = ["/", "/login", "/missao"];

export const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, handleLogin, handleLogout } = useAuthActions();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

  const mostrarSidebar =
    linksDoUtilizador && !paginasSemSidebar.includes(location.pathname);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50">
      {mostrarSidebar && (
        <Sidebar
          links={linksDoUtilizador}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar
          user={user}
          onLoginClick={() => navigate("/login")}
          onLogoutClick={handleLogout}
          isMenuOpen={isSidebarOpen}
          onMenuToggle={() => setIsSidebarOpen((prev) => !prev)}
        />

        <main className="flex-1 overflow-y-auto pb-16">
          <Outlet context={{ user, handleLogin, handleLogout }} />
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default Layout;