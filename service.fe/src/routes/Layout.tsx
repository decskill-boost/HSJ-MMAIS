import { Outlet, useNavigate } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import Footer from "../components/Footer";
import Sidebar, {
  IconeInicio,
  IconeBiblioteca,
  IconePlano,
  type SidebarLink,
} from "../components/Sidebar";
import { useAuthActions } from "../hooks/useAuthActions";

const linksMedico: SidebarLink[] = [
  { to: "/dashboard/medico", label: "Início", Icon: IconeInicio, end: true },
  { to: "/exercicios", label: "Biblioteca de Exercícios", Icon: IconeBiblioteca },
  { to: "/plano/criar", label: "Criar Plano", Icon: IconePlano },
];

const linksPaciente: SidebarLink[] = [
  { to: "/dashboard/paciente", label: "Início", Icon: IconeInicio, end: true },
];

export const Layout = () => {
  const navigate = useNavigate();
  const { user, handleLogin, handleLogout } = useAuthActions();

  // Escolhe os links da sidebar conforme o tipo de utilizador
  const isClinico = user?.tipo_utilizador === "corpo_clinico";
  const isPaciente = user?.tipo_utilizador === "paciente";
  const sidebarLinks = isClinico
    ? linksMedico
    : isPaciente
      ? linksPaciente
      : null;

  return (
    <div className="relative flex min-h-screen flex-col bg-slate-50">
      <Navbar
        user={user}
        onLoginClick={() => navigate("/login")}
        onLogoutClick={handleLogout}
      />
      <div className="flex flex-1">
        {sidebarLinks && <Sidebar links={sidebarLinks} />}
        <main className="flex flex-1 flex-col pb-16">
          <Outlet context={{ user, handleLogin, handleLogout }} />
        </main>
      </div>
      <Footer />
    </div>
  );
};
