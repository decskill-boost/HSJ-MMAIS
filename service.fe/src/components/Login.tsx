import BtnGlobal from "./BtnGlobal";
import CapitaoMais from "./CapitaoMais";
import { useAuth } from "../hooks/useAuth";

const Login = () => {
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

  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl border-[3px] border-tinta bg-papel-claro p-10 shadow-vinheta">
        <div className="text-center">
          <div className="flex justify-center">
            <span className="animate-flutuar">
              <CapitaoMais className="h-28 w-auto" />
            </span>
          </div>
          <h2 className="mt-3 font-display text-4xl tracking-wide text-tinta">
            MMAIS<span className="texto-raio-contorno">+</span>
          </h2>
          <p className="mt-2 font-bold text-aco">Plataforma de Apoio Clínico</p>
        </div>

        {success ? (
          <div className="rounded-xl border-2 border-turbo bg-turbo/10 p-4 text-center">
            <p className="text-sm font-bold text-turbo-escuro">
              Sessão iniciada. A redirecionar…
            </p>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-bold text-tinta"
                >
                  Email Institucional
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full rounded-xl border-2 border-tinta/20 bg-papel px-4 py-3 text-tinta transition focus:border-cobalto focus:bg-papel-claro focus:outline-none focus:ring-2 focus:ring-cobalto/25"
                  placeholder="exemplo@ulsjoao.min-saude.pt"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-bold text-tinta"
                >
                  Palavra-passe
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full rounded-xl border-2 border-tinta/20 bg-papel px-4 py-3 text-tinta transition focus:border-cobalto focus:bg-papel-claro focus:outline-none focus:ring-2 focus:ring-cobalto/25"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="rounded-xl border-2 border-capa/40 bg-capa/10 p-3 text-center text-sm font-bold text-capa-escura">
                {errorMsg}
              </div>
            )}

            <BtnGlobal
              type="submit"
              disabled={loading}
              isLoading={loading}
              className="w-full py-3"
            >
              {loading ? "A verificar…" : "Entrar na conta"}
            </BtnGlobal>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
