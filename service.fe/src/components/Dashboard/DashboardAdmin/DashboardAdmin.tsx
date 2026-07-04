import { useUser } from "../../../contexts/UserContext";
import UserManagement from "./UserManagement/UserManagement";

const DashboardAdmin = () => {
  const { user } = useUser();
  const displayName = user?.nome?.split(" ")[0] ?? "Admin";

  return (
    <div className="flex-1 bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-indigo-800 to-blue-700 p-6 text-white shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
                Painel do Admin
              </p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Olá, {displayName}
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-100 sm:text-base">
                Aqui podes gerir contas de utilizadores, criar novos perfis e
                aceder às funcionalidades administrativas do sistema.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Gestão de Utilizadores
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Começa aqui para criar, editar ou desativar contas de acesso.
              </p>
            </div>
          </div>

          <UserManagement />
        </section>
      </div>
    </div>
  );
};

export default DashboardAdmin;
