import { useState } from "react";
import { authService } from "../services/Auth";
import type { UserProfile } from "../types/user";

export const useAuth = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const handleLogin = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      // 1. Recebemos o perfil que o serviço agora devolve
      const profile = await authService.login({ email, password });

      // 2. Guardamos o perfil no estado
      setUserProfile(profile);
      setSuccess(true);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Ocorreu um erro desconhecido ao tentar iniciar sessão.");
      }
    } finally {
      setLoading(false);
    }
  };
  //  função para expor os resets:
  const resetAuthError = (msg: string) => {
    setSuccess(false);
    setLoading(false);
    setErrorMsg(msg);
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    loading,
    errorMsg,
    success,
    userProfile,
    handleLogin,
    resetAuthError,
  };
};
