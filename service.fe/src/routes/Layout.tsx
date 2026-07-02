import { Outlet, useNavigate } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import Footer from "../components/Footer";
import Sidebar from "../components/Sidebar";
import { useAuthActions } from "../hooks/useAuthActions";

export const Layout = () => {
  const navigate = useNavigate();
  const { user, handleLogin, handleLogout } = useAuthActions();

  // A sidebar só aparece para o corpo clínico (médicos)
  const mostrarSidebar = user?.tipo_utilizador === "corpo_clinico";

  return (
    <div className="relative flex min-h-screen flex-col bg-slate-50">
      <Navbar
        user={user}
        onLoginClick={() => navigate("/login")}
        onLogoutClick={handleLogout}
      />
      <div className="flex flex-1">
        {mostrarSidebar && <Sidebar />}
        <main className="flex flex-1 flex-col pb-16">
          <Outlet context={{ user, handleLogin, handleLogout }} />
        </main>
      </div>
      <Footer />
    </div>
  );
};
