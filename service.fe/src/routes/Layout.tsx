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
const paginasSemSidebar = ["/", "/login"];

export const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, handleLogin, handleLogout } = useAuthActions();

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
    <div className="relative flex min-h-screen flex-col bg-slate-50">
      <Navbar
        user={user}
        onLoginClick={() => navigate("/login")}
        onLogoutClick={handleLogout}
      />
      <div className="flex flex-1">
        {mostrarSidebar && <Sidebar links={linksDoUtilizador} />}
        <main className="flex flex-1 flex-col pb-16">
          <Outlet context={{ user, handleLogin, handleLogout }} />
        </main>
      </div>
      <Footer />
    </div>
  );
};