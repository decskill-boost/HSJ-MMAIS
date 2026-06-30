import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { UserProfile } from "../types/user";

export const useAuthActions = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const navigate = useNavigate();
  // Adiciona o ': boolean' no retorno da função
  const handleLogin = (userProfile: UserProfile): boolean => {
    if (
      userProfile.tipo_utilizador !== "corpo_clinico" &&
      userProfile.tipo_utilizador !== "paciente"
    ) {
      console.error(
        `Acesso bloqueado: Tipo de utilizador desconhecido (${userProfile.tipo_utilizador})`,
      );
      return false; // Retorna false se falhar
    }

    setUser(userProfile);

    if (userProfile.tipo_utilizador === "corpo_clinico") {
      navigate("/dashboard/medico");
    } else if (userProfile.tipo_utilizador === "paciente") {
      navigate("/dashboard/paciente");
    }

    return true; // Retorna true se for válido
  };

  const handleLogout = () => {
    setUser(null);
    navigate("/");
  };

  return {
    user,
    handleLogin,
    handleLogout,
  };
};
