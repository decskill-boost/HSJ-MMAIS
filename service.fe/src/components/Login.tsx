import { useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import BtnGlobal from "./BtnGlobal";
import { useAuth } from "../hooks/useAuth";
import type { UserProfile } from "../types/user";

interface OutletContext {
  handleLogin: (userProfile: UserProfile) => boolean;
}

const Login = () => {
  const { handleLogin: handleLayoutLogin } = useOutletContext<OutletContext>();
  const {
    email,
    setEmail,
    password,
    setPassword,
    loading,
    errorMsg,
    success,
    userProfile,
    handleLogin: handleAuthLogin,
  } = useAuth();

  useEffect(() => {
    if (success && userProfile) {
      const timer = setTimeout(() => {
        // Executa a função e apanha o resultado (true ou false)
        const isAllowed = handleLayoutLogin(userProfile);

        if (!isAllowed) {
          // Se precisares de injetar a mensagem no formulário:
          window.location.reload(); // refresh e limpa o estado e obriga a novo login
          alert(
            "Acesso negado: Perfil de utilizador inválido ou não autorizado.",
          );
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [success, userProfile, handleLayoutLogin]);
  return (
    <div className="flex flex-1 items-center justify-center bg-slate-50 px-4 py-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-10 shadow-xl border border-slate-100">
        <div className="text-center">
          <h2 className="text-4xl font-extrabold tracking-tight text-blue-600">
            +MMAis
          </h2>
          <p className="mt-3 text-slate-500 font-medium">
            Plataforma de Apoio Clínico
          </p>
        </div>

        {success ? (
          <div className="rounded-xl bg-green-50 p-4 text-center animate-pulse">
            <p className="text-sm font-semibold text-green-800">
              Sessão iniciada! A redirecionar...
            </p>
          </div>
        ) : (
          /* Usa a função vinda do useAuth */
          <form className="mt-8 space-y-6" onSubmit={handleAuthLogin}>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-slate-700"
                >
                  Email Institucional
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="exemplo@ulsjoao.min-saude.pt"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-slate-700"
                >
                  Palavra-passe
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-800 border border-red-100 text-center">
                {errorMsg}
              </div>
            )}

            <BtnGlobal
              type="submit"
              disabled={loading}
              isLoading={loading}
              className="group relative flex w-full justify-center rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/30 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              Entrar na conta
            </BtnGlobal>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
