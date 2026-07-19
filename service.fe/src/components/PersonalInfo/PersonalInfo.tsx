import { useOutletContext } from "react-router-dom";
import BtnGlobal from "../BtnGlobal";
import AvatarHeroi from "./AvatarHeroi";
import ClinicalStaffStats from "./ClinicalStaffStats";
import { PatientStats } from "./PatientStats";
import type { UserProfile } from "../../types/user";

interface PersonalInfoProps {
  onBack?: () => void;
}

interface LayoutContext {
  user: UserProfile | null;
  handleLoginSuccess: () => void;
  handleLogout: () => void;
}

export const PersonalInfo = ({ onBack }: PersonalInfoProps) => {
  const { user } = useOutletContext<LayoutContext>();

  if (!user) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <p className="text-aco">Utilizador não autenticado</p>
      </div>
    );
  }

  const isClinico = user.tipo_utilizador === "corpo_clinico";

  // Tema por tipo de utilizador: Cobalto (QG clínico) ou Raio/Turbo (herói) — brandbook Heróis, cap. 07
  const theme = isClinico
    ? {
        color: "text-cobalto",
        bg: "bg-cobalto/10 text-cobalto",
        badge: "bg-cobalto/10 text-cobalto border-cobalto/30",
        label: "Corpo Clínico",
      }
    : {
        color: "text-cobalto",
        bg: "bg-raio/25 text-tinta",
        badge: "bg-raio/25 text-tinta border-raio",
        label: "Herói em treino",
      };

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 text-center">
      {isClinico ? (
        <>
          {/* Foto de Perfil — QG clínico */}
          <div className="entrada-pop flex justify-center">
            {user.url_foto_perfil ? (
              <img
                src={user.url_foto_perfil}
                alt={user.nome}
                className="h-28 w-28 rounded-2xl border-2 border-tinta object-cover shadow-vinheta"
              />
            ) : (
              <div
                className={`flex h-28 w-28 items-end justify-center overflow-hidden rounded-2xl border-2 border-tinta ${theme.bg} shadow-vinheta`}
              >
                <AvatarHeroi variante="clinico" />
              </div>
            )}
          </div>
          <h1 className="mt-4 font-display text-3xl tracking-wide text-tinta">
            {user.nome}
          </h1>
          <p className="text-sm font-bold text-aco">{user.email}</p>
        </>
      ) : (
        <>
          {/* Cartão de herói — o perfil da criança é um cartão colecionável */}
          <div className="entrada-pop relative w-60 -rotate-2 overflow-hidden rounded-2xl border-[3px] border-tinta bg-[linear-gradient(160deg,#3D6BFF_0%,#1D42C8_100%)] p-3 pb-2.5 shadow-vinheta">
            <div className="fundo-reticula pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />
            <div className="relative flex items-center justify-between px-1">
              <span className="font-display text-xs tracking-[.14em] text-raio [text-shadow:1.5px_1.5px_0_#141F3C]">
                HERÓI Nº 001
              </span>
              <span className="font-display text-xs tracking-[.14em] text-papel [text-shadow:1.5px_1.5px_0_#141F3C]">
                MMAIS+
              </span>
            </div>
            <div className="relative mx-auto mt-1 h-40 w-40">
              {user.url_foto_perfil ? (
                <img
                  src={user.url_foto_perfil}
                  alt={user.nome}
                  className="h-full w-full rounded-xl border-2 border-tinta object-cover"
                />
              ) : (
                <AvatarHeroi variante="crianca" />
              )}
            </div>
            <div className="relative mt-1.5 rounded-lg border-2 border-tinta bg-papel-claro px-2 py-1.5">
              <span className="block font-display text-xl leading-tight tracking-wide text-tinta">
                {user.nome}
              </span>
              <span className="block text-[10px] font-bold uppercase tracking-widest text-aco">
                Herói em treino · Nível {user.nivel}
              </span>
            </div>
          </div>
          <p className="mt-3 text-sm font-bold text-aco">{user.email}</p>
        </>
      )}

      {/* Estatísticas: corpo clínico vs. paciente (gamificação) */}
      {isClinico ? (
        <ClinicalStaffStats />
      ) : (
        <PatientStats
          nivel={user.nivel}
          xp={user.xp}
          streak={user.streak_atual}
          themeColor={theme.color}
        />
      )}

      {/* Card de Detalhes da Conta */}
      <div className="entrada-pop-4 mt-6 w-full max-w-md rounded-2xl border-2 border-tinta bg-papel-claro p-6 text-left shadow-vinheta">
        <h2
          className={`text-sm font-bold uppercase tracking-wider ${theme.color} mb-4`}
        >
          Detalhes da Conta
        </h2>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-aco">
              Tipo de Utilizador
            </label>
            <span
              className={`ml-2 inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${theme.badge}`}
            >
              {theme.label}
            </span>
          </div>
          <div className="border-t border-tinta/10 pt-3">
            <label className="text-xs font-bold uppercase tracking-wider text-aco">
              Membro desde
            </label>
            <p className="text-base font-bold text-tinta">
              {new Date(user.data_registo).toLocaleDateString("pt-PT")}
            </p>
          </div>
        </div>
      </div>

      {onBack && (
        <BtnGlobal onClick={onBack} variant="primary" className="mt-8 px-10 py-3.5">
          Voltar ao Menu
        </BtnGlobal>
      )}
    </div>
  );
};

export default PersonalInfo;
