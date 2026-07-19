import { useOutletContext } from "react-router-dom";
import BtnGlobal from "../BtnGlobal";
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
      {/* Foto de Perfil */}
      <div className="flex justify-center">
        {user.url_foto_perfil ? (
          <img
            src={user.url_foto_perfil}
            alt={user.nome}
            className="h-28 w-28 rounded-2xl border-2 border-tinta object-cover shadow-vinheta"
          />
        ) : (
          <div
            className={`flex h-28 w-28 items-center justify-center rounded-2xl ${theme.bg} shadow-sm`}
          >
            <svg
              className="h-14 w-14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
        )}
      </div>

      <h1 className="mt-4 font-display text-3xl tracking-wide text-tinta">
        {user.nome}
      </h1>
      <p className="text-sm font-bold text-aco">{user.email}</p>

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
      <div className="mt-6 w-full max-w-md rounded-2xl border-2 border-tinta bg-papel-claro p-6 text-left shadow-vinheta">
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
