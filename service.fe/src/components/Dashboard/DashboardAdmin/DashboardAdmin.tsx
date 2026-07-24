import { useUser } from "../../../contexts/UserContext";
import UserManagement from "./UserManagement/UserManagement";

const DashboardAdmin = () => {
  const { user } = useUser();
  // Nome tal como está registado — não cortar no primeiro espaço.
  const displayName = user?.nome?.trim() || "Admin";

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Cabeçalho sóbrio (Papel/Cobalto/Aço), como o resto do QG clínico.
          O banner escuro anterior era linguagem da Academia. */}
      <div className="mb-6 rounded-(--radius-vinheta) border-[3px] border-tinta bg-papel-claro p-6 shadow-vinheta sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-cobalto">
          Painel do Admin
        </p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-tinta sm:text-4xl">
          Olá, {displayName}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-aco">
          Faça a gestão das contas de acesso: criar, editar e desativar
          utilizadores da plataforma.
        </p>
      </div>

      {/* Sem cartão intermédio: a gestão de utilizadores é o conteúdo da página */}
      <UserManagement />
    </div>
  );
};

export default DashboardAdmin;
