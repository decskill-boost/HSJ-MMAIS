import { Link, NavLink, useLocation } from "react-router-dom";
import BtnGlobal from "./BtnGlobal";
import CapitaoMais from "./CapitaoMais";
import AvatarHeroi from "./PersonalInfo/AvatarHeroi";
import type { UserProfile } from "../types/user";

interface NavbarProps {
  user: UserProfile | null;
  onLoginClick?: () => void;
  onLogoutClick?: () => void;
}

const TRATAMENTOS = /^(dr|dra|prof|enf|enfa|sr|sra)\.?$/i;

/** «Dra. Rita Marques» → «Dra. Rita»; «Miguel Santos» → «Miguel». */
const nomeCurto = (nome: string) => {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  const primeiro = partes.findIndex((parte) => !TRATAMENTOS.test(parte));
  if (primeiro === -1) return nome;
  return [...partes.slice(0, primeiro), partes[primeiro]].join(" ");
};

export const Navbar = ({ user, onLoginClick, onLogoutClick }: NavbarProps) => {
  const { pathname } = useLocation();
  const isClinico = user?.tipo_utilizador === "corpo_clinico";

  return (
    <header className="sticky top-0 z-30 border-b-[3px] border-tinta bg-papel-claro/95 backdrop-blur-sm">
      {/* Altura fixa: sem ela a barra saltava nos ecrãs sem botão à direita. */}
      <div className="mx-auto flex min-h-18 w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
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

        {user ? (
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Sem isto, quem saía do perfil não tinha como lá voltar. */}
            <NavLink
              to="/perfil"
              className={({ isActive }) =>
                `flex min-h-12 items-center gap-2 rounded-(--radius-vinheta) border-[3px] border-tinta px-2 shadow-vinheta transition-colors sm:pr-3 ${
                  isActive
                    ? isClinico
                      ? "bg-cobalto-nevoa"
                      : "bg-raio/40"
                    : "bg-papel-claro hover:bg-raio/20"
                }`
              }
            >
              <span className="flex h-8 w-8 items-end justify-center overflow-hidden rounded-md border-2 border-tinta bg-cobalto-nevoa">
                {user.url_foto_perfil ? (
                  <img
                    src={user.url_foto_perfil}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <AvatarHeroi
                    variante={isClinico ? "clinico" : "crianca"}
                    animado={false}
                  />
                )}
              </span>
              <span className="hidden max-w-32 truncate text-sm font-bold text-tinta sm:inline">
                {nomeCurto(user.nome)}
              </span>
              <span className="sr-only">Ver o meu perfil</span>
            </NavLink>

            <BtnGlobal onClick={onLogoutClick} variant="secondary" size="sm">
              Sair
            </BtnGlobal>
          </div>
        ) : (
          // Já no ecrã de entrar, o botão não levava a lado nenhum.
          onLoginClick &&
          pathname !== "/login" && (
            <BtnGlobal onClick={onLoginClick} variant="secondary" size="sm">
              Entrar
            </BtnGlobal>
          )
        )}
      </div>
    </header>
  );
};

export default Navbar;
