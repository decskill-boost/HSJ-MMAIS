import { useState } from "react";
import WelcomePage from "./components/WelcomePage";
import LoginForm from "./components/LoginForm";
import type { UserProfile } from "./types/user";
import PersonalInfo from "./components/PersonalInfo/PersonalInfo";

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

  // 1. Se o utilizador já está logado, mostra o Perfil
  if (user) {
    return (
      <PersonalInfo user={user} onLogout={handleLogout} onBack={handleLogout} />
    );
  }

  // 2. Se não está logado, decide entre o Form de Login ou a WelcomePage
  return (
    <main>
      {autenticar ? (
        // Passas uma prop para o teu LoginForm (quando o fizeres) para ativar o login
        <LoginForm onLoginSuccess={handleLoginSuccess} />
      ) : (
        <WelcomePage onEnter={() => setAutenticar(true)} />
      )}
    </main>
  );
}

export default App;
