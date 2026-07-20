import { Link } from "react-router-dom";
import BtnGlobal from "./BtnGlobal";
import UserMenu from "./UserMenu";
import type { UserProfile } from "../types/user";

// Ícones para o Menu Mobile
const IconMenu = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <line x1="3" y1="12" x2="21" y2="12"></line>
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <line x1="3" y1="18" x2="21" y2="18"></line>
  </svg>
);

const IconClose = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

interface NavbarProps {
  user: UserProfile | null;
  onLoginClick?: () => void;
  onLogoutClick?: () => void;
  isMenuOpen?: boolean;
  onMenuToggle?: () => void;
}

export const Navbar = ({
  user,
  onLoginClick,
  onLogoutClick,
  isMenuOpen,
  onMenuToggle,
}: NavbarProps) => {
  const isClinico = user?.tipo_utilizador === "corpo_clinico";
  const brandColor = isClinico
    ? "text-indigo-600 hover:text-indigo-700"
    : "text-blue-600 hover:text-blue-700";

  return (
    <header className="h-[68px] sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-sm px-4 py-0 sm:px-6 lg:px-8">
      {/* ZERO px aqui dentro! Só mx-auto e max-w-6xl */}
      <div className="mx-auto flex h-full w-full max-w-6xl items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Botão Hamburger (só aparece em mobile e se houver utilizador logado) */}
          {user && (
            <button
              onClick={onMenuToggle}
              className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 md:hidden"
              aria-label="Alternar menu"
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? (
                <IconClose className="h-6 w-6" />
              ) : (
                <IconMenu className="h-6 w-6" />
              )}
            </button>
          )}

          <Link
            to="/"
            className={`text-2xl font-extrabold tracking-tight transition-colors ${brandColor}`}
          >
            +MMAis
          </Link>
        </div>

        {/* Canto direito: avatar + dropdown com sessão; senão, "Entrar" */}
        {user ? (
          <UserMenu user={user} onLogout={onLogoutClick} />
        ) : (
          onLoginClick && (
            <BtnGlobal
              onClick={onLoginClick}
              variant="secondary"
              className="focus:ring-2 focus:ring-blue-500/20"
            >
              Entrar
            </BtnGlobal>
          )
        )}
      </div>
    </header>
  );
};

export default Navbar;