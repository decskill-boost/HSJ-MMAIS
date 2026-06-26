import { useState } from "react";
import WelcomePage from "./components/WelcomePage";
import LoginForm from "./components/LoginForm";
import type { UserProfile } from "./types/user";
import PersonalInfo from "./components/PersonalInfo/PersonalInfo";
import { Navbar } from "./components/Navbar";

// Utilizador fictício para testes
const mockUser: UserProfile = {
  id_user: "usr_999_sao_joao",
  nome: "Dr. Nuno Costa",
  email: "nuno.costa@ulssaojoao.min-saude.pt",
  tipo_utilizador: "corpo_clinico",
  xp: 0,
  nivel: 0,
  streak_atual: 0,
  data_registo: "2026-01-15T12:00:00Z",
};

function App() {
  const [autenticar, setAutenticar] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);

  // Funções de navegação/ação
  const handleLoginSuccess = () => {
    setUser(mockUser); // Simula que o login teve sucesso e guarda o user
  };

  const handleLogout = () => {
    setUser(null);
    setAutenticar(false); // Volta para a WelcomePage
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* 1. Navbar Global e Única */}
      <Navbar
        user={user}
        onLoginClick={() => setAutenticar(true)}
        onLogoutClick={handleLogout}
      />

      {/* 2. Conteúdo Dinâmico das Páginas */}
      <main className="flex flex-1 flex-col">
        {user ? (
          <PersonalInfo user={user} onBack={handleLogout} />
        ) : autenticar ? (
          <LoginForm onLoginSuccess={handleLoginSuccess} />
        ) : (
          <WelcomePage onEnter={() => setAutenticar(true)} />
        )}
      </main>
    </div>
  );
}

export default App;
