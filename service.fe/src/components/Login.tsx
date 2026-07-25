import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BtnGlobal from "./BtnGlobal";
import CapitaoMais from "./CapitaoMais";
import { useAuth } from "../hooks/useAuth";
import { useTituloPagina } from "../hooks/useTituloPagina";

const campo =
  "mt-1 block w-full rounded-xl border-2 border-tinta/35 bg-papel px-4 py-3 text-tinta transition placeholder:text-aco/70 focus:border-cobalto focus:bg-papel-claro";

const Login = () => {
  const navigate = useNavigate();
  const [mostrarPasse, setMostrarPasse] = useState(false);
  useTituloPagina("Entrar");
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

  // O `Layout` já ouve a sessão do Supabase; aqui só falta trocar de página.
  useEffect(() => {
    if (!success) return;

    // Dá tempo para o utilizador ler a mensagem de sucesso.
    const timer = setTimeout(() => navigate("/perfil", { replace: true }), 1500);
    return () => clearTimeout(timer);
  }, [success, navigate]);

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="painel painel-alto relative w-full max-w-md p-8 sm:p-10">
        <span className="legenda absolute -left-2 -top-3">Entrar</span>

        <div className="flex flex-col items-center text-center">
          <span className="animate-flutuar">
            <CapitaoMais className="h-20 w-auto" title="" />
          </span>
          <h1 className="mt-3 font-display text-4xl tracking-wide text-tinta">
            MMAIS<span className="texto-raio-contorno">+</span>
          </h1>
          <p className="mt-2 text-sm font-bold text-aco">
            Email e palavra-passe fornecidos pelo hospital.
          </p>
        </div>

        {success ? (
          <p
            className="mt-8 rounded-xl border-2 border-turbo bg-turbo/10 p-4 text-center text-sm font-bold text-turbo-escuro"
            role="status"
          >
            Sessão iniciada! A abrir o perfil…
          </p>
        ) : (
          <form className="mt-8 space-y-5" onSubmit={handleLogin}>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-bold text-tinta"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoFocus
                autoComplete="email"
                inputMode="email"
                spellCheck={false}
                aria-invalid={errorMsg ? true : undefined}
                aria-describedby={errorMsg ? "erro-sessao" : undefined}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={campo}
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
              <div className="relative">
                <input
                  id="password"
                  type={mostrarPasse ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  aria-invalid={errorMsg ? true : undefined}
                  aria-describedby={errorMsg ? "erro-sessao" : undefined}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${campo} pr-24`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setMostrarPasse((visivel) => !visivel)}
                  className="absolute inset-y-1 right-1 rounded-lg px-3 text-xs font-bold uppercase tracking-wider text-cobalto transition-colors hover:bg-cobalto/10"
                >
                  {mostrarPasse ? "Ocultar" : "Mostrar"}
                  <span className="sr-only"> palavra-passe</span>
                </button>
              </div>
            </div>

            {errorMsg && (
              <p
                id="erro-sessao"
                role="alert"
                className="rounded-xl border-2 border-capa bg-capa/10 p-3 text-center text-sm font-bold text-capa-escura"
              >
                {errorMsg}
              </p>
            )}

            <BtnGlobal
              type="submit"
              size="lg"
              disabled={loading}
              isLoading={loading}
              className="w-full"
            >
              {loading ? "A verificar…" : "Entrar"}
            </BtnGlobal>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
