import ClinicalStaffStats from "./ClinicalStaffStats";
import type { PersonalInfoProps } from "../../types/user";

export const PersonalInfo = ({ user, onLogout, onBack }: PersonalInfoProps) => {
  // Cores fixas do tema do Corpo Clínico (Índigo)
  const theme = {
    color: "text-indigo-600",
    bg: "bg-indigo-50 text-indigo-600",
    btn: "bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500/30",
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <span
            onClick={onBack}
            className={`text-2xl font-extrabold tracking-tight ${theme.color} cursor-pointer`}
          >
            +MMAis
          </span>
          <button
            onClick={onLogout}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Sair
          </button>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-12 text-center">
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

        {/* Apenas Corpo Clínico e mais nada para já */}
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
                {new Date(user.data_registo).toLocaleDateString("pt-PT")}
              </p>
            </div>
          </div>
        </div>

        {onBack && (
          <button
            onClick={onBack}
            className={`mt-8 rounded-xl px-10 py-3.5 text-sm font-bold text-white shadow-lg transition-all ${theme.btn}`}
          >
            Voltar ao Menu
          </button>
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white py-5 text-center text-sm text-slate-400">
        ULS São João · 2026
      </footer>
    </div>
  );
};

export default PersonalInfo;
