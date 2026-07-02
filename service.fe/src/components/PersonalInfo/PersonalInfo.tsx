import { useOutletContext } from "react-router-dom";
import BtnGlobal from "../BtnGlobal";
import ClinicalStaffStats from "./ClinicalStaffStats";
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
        <p className="text-slate-500">Utilizador não autenticado</p>
      </div>
    );
  }
  // Cores fixas do tema do Corpo Clínico (Índigo)
  const theme = {
    color: "text-indigo-600",
    bg: "bg-indigo-50 text-indigo-600",
    btn: "bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500/30",
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 text-center">
      {/* Foto de Perfil */}
      <div className="flex justify-center">
        {user.url_foto_perfil ? (
          <img
            src={user.url_foto_perfil}
            alt={user.nome}
            className="h-28 w-28 rounded-2xl object-cover shadow-sm border border-slate-100"
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

      <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900">
        {user.nome}
      </h1>
      <p className="text-sm font-medium text-slate-500">{user.email}</p>

      {/* Estatísticas do Corpo Clínico */}
      <ClinicalStaffStats />

      {/* Card de Detalhes da Conta */}
      <div className="mt-6 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm">
        <h2
          className={`text-sm font-bold uppercase tracking-wider ${theme.color} mb-4`}
        >
          Detalhes da Conta
        </h2>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Tipo de Utilizador
            </label>
            <span className="ml-2 inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium border bg-indigo-50 text-indigo-700 border-indigo-200">
              Corpo Clínico
            </span>
          </div>
          <div className="border-t border-slate-100 pt-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Membro desde
            </label>
            <p className="text-base font-semibold text-slate-800">
              {user.data_registo
                ? new Date(user.data_registo).toLocaleDateString("pt-PT")
                : "Sem informação"}
            </p>
          </div>
        </div>
      </div>

      {onBack && (
        <BtnGlobal
          onClick={onBack}
          variant="primary"
          className={`mt-8 rounded-xl px-10 py-3.5 text-sm font-bold text-white shadow-lg transition-all ${theme.btn}`}
        >
          Voltar ao Menu
        </BtnGlobal>
      )}
    </div>
  );
};

export default PersonalInfo;
