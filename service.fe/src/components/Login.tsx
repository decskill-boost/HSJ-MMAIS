import { useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import BtnGlobal from "./BtnGlobal";
import { useAuth } from "../hooks/useAuth";

interface OutletContext {
  handleLoginSuccess: () => void;
}

const Login = () => {
  const { handleLoginSuccess } = useOutletContext<OutletContext>();
  const {
    email,
    setEmail,
    password,
    setPassword,
    loading,
    errorMsg,
    success,
    handleLogin,
  } = useAuth();

  // Quando o hook do Supabase/Auth mudar o estado 'success' para true,
  // avisa o Layout para trocar de página
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        handleLoginSuccess();
      }, 1500); // Dá tempo para o utilizador ler a mensagem de sucesso
      return () => clearTimeout(timer);
    }
  }, [success, handleLoginSuccess]);

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
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
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
              {loading ? "A verificar..." : "Entrar na conta"}
            </BtnGlobal>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
