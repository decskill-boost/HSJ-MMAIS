import type { UserProfile } from "../types/user";

interface NavbarProps {
  user: UserProfile | null;
  onLoginClick?: () => void;
  onLogoutClick?: () => void;
}

export const Navbar = ({ user, onLoginClick, onLogoutClick }: NavbarProps) => {
  // Define a cor base dependendo se o utilizador está logado ou não
  const isClinico = user?.tipo_utilizador === "corpo_clinico";
  const brandColor = isClinico ? "text-indigo-600" : "text-blue-600";

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        {/* Logótipo / Nome da App */}
        <span
          className={`text-2xl font-extrabold tracking-tight ${brandColor}`}
        >
          +MMAis
        </span>

        {/* Botão Dinâmico */}
        {user ? (
          <button
            onClick={onLogoutClick}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            Sair
          </button>
        ) : (
          onLoginClick && (
            <button
              onClick={onLoginClick}
              className="rounded-xl border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              Entrar
            </button>
          )
        )}
      </div>
    </header>
  );
};

export default Navbar;
