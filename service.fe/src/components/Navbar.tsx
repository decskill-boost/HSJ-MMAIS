import { Link } from "react-router-dom";
import BtnGlobal from "./BtnGlobal";
import UserMenu from "./UserMenu";
import type { UserProfile } from "../types/user";

interface NavbarProps {
  user: UserProfile | null;
  onLoginClick?: () => void;
  onLogoutClick?: () => void;
}

export const Navbar = ({ user, onLoginClick, onLogoutClick }: NavbarProps) => {
  const isClinico = user?.tipo_utilizador === "corpo_clinico";
  const brandColor = isClinico
    ? "text-indigo-600 hover:text-indigo-700"
    : "text-blue-600 hover:text-blue-700";

  return (
    <header className="h-17 sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-full w-full max-w-6xl items-center justify-between px-6">
        <Link
          to="/"
          className={`text-2xl font-extrabold tracking-tight transition-colors ${brandColor}`}
        >
          +MMAis
        </Link>

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
