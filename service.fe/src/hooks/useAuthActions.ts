import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import { authService } from "../services/Auth";
import type { UserProfile } from "../types/permissions";

export const useAuthActions = () => {
  // 1. Consumimos DIRETAMENTE o estado global e a função de atualizar do Contexto
  const { user, setUser } = useUser() as {
    user: UserProfile | null;
    setUser?: (user: UserProfile | null) => void;
  };
  const navigate = useNavigate();

  const handleLogin = (userProfile: UserProfile): boolean => {
    console.log("[useAuthActions] handleLogin chamado", userProfile.email);

    if (
      userProfile.role !== "corpo_clinico" &&
      userProfile.role !== "paciente"
    ) {
      console.error(
        `Acesso bloqueado: Tipo de utilizador desconhecido (${userProfile.role})`,
      );
      return false;
    }

    // 2. Atualiza DIRETAMENTE o estado global. Não há useState local aqui!
    if (setUser) {
      setUser(userProfile);
    }

    if (userProfile.role === "corpo_clinico") {
      navigate("/dashboard/medico");
    } else if (userProfile.role === "paciente") {
      navigate("/dashboard/paciente");
    }

    return true;
  };

  const handleLogout = async () => {
    console.log("[useAuthActions] handleLogout chamado");
    try {
      await authService.logout();
    } catch (error) {
      console.error("Falha ao terminar sessão", error);
    } finally {
      // 3. Limpa o estado global
      if (setUser) {
        setUser(null);
      }
      navigate("/");
    }
  };

  return {
    user, // Retorna diretamente o user do contexto
    handleLogin,
    handleLogout,
  };
};
