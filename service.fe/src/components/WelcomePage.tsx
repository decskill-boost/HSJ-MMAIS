import React from "react";

interface WelcomePageProps {
  onEnter?: () => void;
  onStart?: () => void;
  logoSrc?: string;
}

export const WelcomePage: React.FC<WelcomePageProps> = ({
  onEnter = () => {},
  onStart,
  logoSrc,
}) => {
  const handleStart = onStart ?? onEnter;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Navbar */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-2xl font-extrabold tracking-tight text-blue-600">
            +MMAis
          </span>
          <button
            onClick={onEnter}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            Entrar
          </button>
        </div>
      </header>


      <main className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          Bem-vindo ao <span className="text-blue-600">+MMAis</span>!
        </h1>

        <div className="mt-10 flex justify-center">
          {logoSrc ? (
            <img
              src={logoSrc}
              alt="+MMAis"
              className="h-32 w-32 rounded-2xl object-contain"
            />
          ) : (
            <div className="flex h-32 w-32 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <svg
                className="h-14 w-14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
          )}
        </div>

        <p className="mt-10 text-sm font-bold uppercase tracking-widest text-blue-600">
          Mais Minutos Ativos
        </p>
        <p className="mx-auto mt-3 max-w-md text-lg text-slate-500">
          A tua aplicação para te manteres forte, ativo(a) e te divertires!
        </p>

        <button
          onClick={handleStart}
          className="mt-10 rounded-xl bg-blue-600 px-10 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/30"
        >
          Começar!
        </button>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-1 px-6 py-5 text-sm text-slate-400 sm:flex-row sm:justify-center">
          <span>ULS São João · 2026</span>
          <a href="#ajuda" className="text-slate-500 transition hover:text-blue-600 sm:absolute sm:right-6">Ajuda (?)</a>
        </div>
      </footer>
    </div>
  );
};

export default WelcomePage;