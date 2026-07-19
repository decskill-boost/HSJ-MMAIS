import { Link } from "react-router-dom";
import BtnGlobal from "./BtnGlobal";
import CapitaoMais from "./CapitaoMais";
import type { UserProfile } from "../types/user";

interface NavbarProps {
  user: UserProfile | null;
  onLoginClick?: () => void;
  onLogoutClick?: () => void;
}

export const Navbar = ({ user, onLoginClick, onLogoutClick }: NavbarProps) => {
  return (
    <header className="sticky top-0 z-30 border-b-[3px] border-tinta bg-papel-claro/95 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-3">
        <Link
          to="/"
          className="flex items-center gap-2.5 font-display text-2xl tracking-wide text-tinta transition-opacity hover:opacity-80"
        >
          <span className="animate-balancar">
            <CapitaoMais className="h-10 w-auto" title="" />
          </span>
          <span>
            MMAIS<span className="texto-raio-contorno">+</span>
          </span>
        </Link>

        {/* Botão Dinâmico */}
        {user ? (
          <BtnGlobal onClick={onLogoutClick} variant="secondary">
            Sair
          </BtnGlobal>
        ) : (
          onLoginClick && (
            <BtnGlobal onClick={onLoginClick} variant="secondary">
              Entrar
            </BtnGlobal>
          )
        )}
      </div>
    </header>
  );
};

export default Navbar;
