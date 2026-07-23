import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { UserProfile } from "../types/user";

interface UserMenuProps {
  user: UserProfile;
  onLogout?: () => void;
}

export const UserMenu = ({ user, onLogout }: UserMenuProps) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isClinico = user.tipo_utilizador === "corpo_clinico";
  const avatarColor = isClinico ? "bg-cobalto" : "bg-cobalto";
  const ringColor = isClinico
    ? "focus:ring-cobalto/30"
    : "focus:ring-cobalto/30";

  // Inicial a partir do nome (ou do email, se não houver nome)
  const initial = (user.nome || user.email || "?")
    .trim()
    .charAt(0)
    .toUpperCase();

  // Fechar o dropdown ao clicar fora ou ao carregar Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      {/* Avatar (inicial ou foto) */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`flex h-10 w-10 items-center justify-center overflow-hidden rounded-full text-sm font-bold text-papel transition focus:outline-none focus:ring-2 ${avatarColor} ${ringColor}`}
      >
        {user.url_foto_perfil ? (
          <img
            src={user.url_foto_perfil}
            alt={user.nome}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          initial
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-xl border border-tinta/15 bg-papel-claro shadow-lg"
        >
          <div className="border-b border-tinta/10 px-4 py-3">
            <p className="truncate text-sm font-semibold text-tinta">
              {user.nome}
            </p>
            <p className="truncate text-sm text-aco">{user.email}</p>
          </div>

          <Link
            to="/perfil"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block w-full px-4 py-3 text-left text-sm font-medium text-tinta transition hover:bg-papel"
          >
            Informação pessoal
          </Link>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onLogout?.();
            }}
            className="block w-full border-t border-tinta/10 px-4 py-3 text-left text-sm font-medium text-capa-escura transition hover:bg-papel"
          >
            Terminar sessão
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
