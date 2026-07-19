import { useUser } from "../../../contexts/UserContext";
import UserManagement from "./UserManagement/UserManagement";

const DashboardAdmin = () => {
  const { user } = useUser();
  const displayName = user?.nome?.split(" ")[0] ?? "Admin";

  return (
    <div className="flex-1 bg-papel px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <section className="rounded-3xl border border-tinta/15 bg-gradient-to-br from-tinta via-cobalto to-cobalto-vivo p-6 text-papel shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-tinta/20">
                Painel do Admin
              </p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Olá, {displayName}
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-tinta/10 sm:text-base">
                Aqui podes gerir contas de utilizadores, criar novos perfis e
                aceder às funcionalidades administrativas do sistema.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-tinta/15 bg-papel-claro p-6 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-tinta">
                Gestão de Utilizadores
              </h2>
              <p className="mt-2 text-sm text-aco">
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
