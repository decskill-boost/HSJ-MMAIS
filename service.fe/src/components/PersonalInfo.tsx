import { useOutletContext } from "react-router-dom";
import BtnGlobal from "./BtnGlobal"; // Ajusta o path se necessário
import type { UserProfile } from "../types/user";

interface PersonalInfoProps {
  onBack?: () => void;
}

interface LayoutContext {
  user: UserProfile | null;
  handleLoginSuccess: () => void;
  handleLogout: () => void;
}

// Função auxiliar para formatar o nome da role
const getRoleLabel = (role?: string) => {
  switch (role) {
    case "corpo_clinico":
      return "Corpo Clínico";
    case "paciente":
      return "Paciente";
    case "admin":
      return "Administrador";
    default:
      return "Utilizador";
  }
};

export const PersonalInfo = ({ onBack }: PersonalInfoProps) => {
  const { user } = useOutletContext<LayoutContext>();

  return (
    <div className="flex-1 bg-papel px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-2xl font-bold text-tinta">O Meu Perfil</h1>

        {/* Cartão Principal */}
        <div className="rounded-3xl border border-tinta/15 bg-papel-claro p-6 shadow-sm sm:p-8">
          {/* Cabeçalho: Foto + Info Básica */}
          <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
            <div className="flex-shrink-0">
              {user?.url_foto_perfil ? (
                <img
                  src={user.url_foto_perfil}
                  alt={user.nome}
                  className="h-24 w-24 rounded-full border border-tinta/15 object-cover shadow-sm"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full border border-cobalto/20 bg-cobalto/10 text-cobalto shadow-sm">
                  <span className="text-3xl font-bold uppercase">
                    {user?.nome?.charAt(0) || "?"}
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-1 flex-col sm:items-start">
              <span className="mb-2 inline-flex items-center rounded-full border border-cobalto/25 bg-cobalto/10 px-2.5 py-0.5 text-xs font-semibold text-cobalto">
                {getRoleLabel(user?.role || user?.tipo_utilizador)}
              </span>
              <h2 className="text-2xl font-extrabold tracking-tight text-tinta">
                {user?.nome}
              </h2>
              <p className="mt-1 font-medium text-aco">{user?.email}</p>
            </div>
          </div>

          <hr className="my-8 border-tinta/15" />

          {/* Detalhes da Conta */}
          <div>
            <h3 className="mb-4 text-base font-bold text-tinta">
              Detalhes da Conta
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-tinta/15 bg-papel p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-aco">
                  Data de Registo
                </p>
                <p className="mt-1 font-semibold text-tinta">
                  {user?.data_registo
                    ? new Date(user.data_registo).toLocaleDateString("pt-PT")
                    : "Sem informação"}
                </p>
              </div>
              <div className="rounded-2xl border border-tinta/15 bg-papel p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-aco">
                  Estado da Conta
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-turbo opacity-75"></span>
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-turbo-escuro"></span>
                  </span>
                  <p className="font-semibold text-tinta">Ativa</p>
                </div>
              </div>
            </div>
          </div>

          {/* Botão de Voltar (se aplicável) */}
          {onBack && (
            <div className="mt-8 border-t border-tinta/15 pt-6">
              <BtnGlobal
                onClick={onBack}
                className="w-full rounded-xl bg-cobalto py-3.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-cobalto-vivo sm:w-auto sm:px-8"
              >
                Voltar ao Menu
              </BtnGlobal>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PersonalInfo;
