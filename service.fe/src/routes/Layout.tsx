import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import type { UserProfile } from "../types/user";
import Footer from "../components/Footer";

// utilizador fictício para testes
const mockUser: UserProfile = {
  id_user: "usr_999_sao_joao",
  nome: "Dr. Test",
  email: "test@ulssaojoao.min-saude.pt",
  tipo_utilizador: "corpo_clinico",
  xp: 0,
  nivel: 0,
  streak_atual: 0,
  data_registo: "2026-01-15T12:00:00Z",
};

export const Layout = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const navigate = useNavigate();

  const handleLoginSuccess = () => {
    setUser(mockUser);
    navigate("/perfil"); // Vai para o perfil após o login
  };

  const handleLogout = () => {
    setUser(null);
    navigate("/"); // Volta ao início
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-slate-50">
      <Navbar
        user={user}
        onLoginClick={() => navigate("/login")}
        onLogoutClick={handleLogout}
      />
      <main className="flex flex-1 flex-col pb-16">
        {/* O Outlet é onde o React Router vai injetar as páginas (Welcome, Login, Perfil) */}
        <Outlet context={{ user, handleLoginSuccess, handleLogout }} />
      </main>
      <Footer />
    </div>
  );
};
