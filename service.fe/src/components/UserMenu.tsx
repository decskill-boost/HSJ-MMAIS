import { useEffect, useRef, useState } from "react";
import type { UserProfile } from "../types/user";

interface UserMenuProps {
  user: UserProfile;
  onLogout?: () => void;
}

export const UserMenu = ({ user, onLogout }: UserMenuProps) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isClinico = user.tipo_utilizador === "corpo_clinico";
  const avatarColor = isClinico ? "bg-indigo-600" : "bg-blue-600";
  const ringColor = isClinico
    ? "focus:ring-indigo-500/30"
    : "focus:ring-blue-500/30";

  // Inicial a partir do nome (ou do email, se não houver nome)
  const initial = (user.nome || user.email || "?").trim().charAt(0).toUpperCase();

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
        className={`flex h-10 w-10 items-center justify-center overflow-hidden rounded-full text-sm font-bold text-white transition focus:outline-none focus:ring-2 ${avatarColor} ${ringColor}`}
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
          className="absolute right-0 mt-2 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
        >
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="truncate text-sm font-semibold text-slate-900">
              {user.nome}
            </p>
            <p className="truncate text-sm text-slate-500">{user.email}</p>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onLogout?.();
            }}
            className="block w-full px-4 py-3 text-left text-sm font-medium text-red-600 transition hover:bg-slate-50"
          >
            Terminar sessão
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;