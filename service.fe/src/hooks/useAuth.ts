import { useState } from "react";
import { authService } from "../services/Auth";

export const useAuth = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const handleLogin = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      await authService.login({ email, password });
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
  return {
    email,
    setEmail,
    password,
    setPassword,
    loading,
    errorMsg,
    success,
    handleLogin,
  };
};
