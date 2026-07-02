import { useState } from "react";
import { authService } from "../services/Auth";
import { useAuthActions } from "./useAuthActions";

export const useAuth = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  // Importamos a ação global que acabámos de limpar
  const { handleLogin: loginAndSetGlobalState } = useAuthActions();

  const handleLogin = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      // 1. O serviço faz a comunicação com o Supabase e o NestJS
      const profile = await authService.login({ email, password });

      // 2. Passamos o perfil para a ação global (que atualiza o UserContext e redireciona)
      loginAndSetGlobalState(profile);

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
    handleLogin,
    resetAuthError,
  };
};
