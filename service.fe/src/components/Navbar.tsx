import { Link } from "react-router-dom"; // 1. Importa o Link aqui
import BtnGlobal from "./BtnGlobal";
import type { UserProfile } from "../types/user";

interface NavbarProps {
  user: UserProfile | null;
  onLoginClick?: () => void;
  onLogoutClick?: () => void;
}

export const Navbar = ({ user, onLoginClick, onLogoutClick }: NavbarProps) => {
  // Define a cor base dependendo se o utilizador está logado ou não
  const isClinico = user?.tipo_utilizador === "corpo_clinico";
  const brandColor = isClinico
    ? "text-indigo-600 hover:text-indigo-700"
    : "text-blue-600 hover:text-blue-700";

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link
          to="/"
          className={`text-2xl font-extrabold tracking-tight transition-colors ${brandColor}`}
        >
          +MMAis
        </Link>

        {/* Botão Dinâmico */}
        {user ? (
          <BtnGlobal
            onClick={onLogoutClick}
            variant="secondary"
            className="focus:ring-2 focus:ring-indigo-500/20"
          >
            Sair
          </BtnGlobal>
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
