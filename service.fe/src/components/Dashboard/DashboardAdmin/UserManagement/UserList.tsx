import type { UserProfile } from "../../../../types/permissions";
import ConfirmDialog from "./ConfirmDialog";
import { useState } from "react";

interface Props {
  users: UserProfile[];
  loading: boolean;
  onEdit: (user: UserProfile) => void;
  onDisable: (id: string) => void;
}

const getRoleLabel = (role?: string) => {
  switch (role) {
    case "corpo_clinico":
      return "Corpo Clínico";
    case "paciente":
      return "Paciente";
    case "admin":
      return "Administrador";
    case "acompanhante":
      return "Acompanhante";
    default:
      return role || "Utilizador";
  }
};

const UserList = ({ users, loading, onEdit, onDisable }: Props) => {
  const [toDelete, setToDelete] = useState<UserProfile | null>(null);

  if (loading && users.length === 0) {
    return (
      <div className="rounded-3xl border border-tinta/15 bg-papel-claro p-6 shadow-sm flex items-center justify-center min-h-[200px]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-tinta/15 border-t-cobalto"></div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-tinta/15 bg-papel-claro p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-tinta">
            Lista de utilizadores
          </h2>
          <p className="mt-1 text-sm text-aco">
            Gerencie as contas de acesso à plataforma.
          </p>
        </div>
        <span className="rounded-full bg-papel px-3 py-1.5 text-xs font-semibold text-tinta">
          {users.length} registos
        </span>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-tinta/15">
        <table className="min-w-full divide-y divide-tinta/15 text-left text-sm">
          <thead className="bg-papel text-xs font-bold uppercase tracking-wider text-aco">
            <tr>
              <th className="px-6 py-4 font-semibold w-[35%]">Nome</th>
              <th className="px-6 py-4 font-semibold w-[35%]">Email</th>
              <th className="px-6 py-4 font-semibold w-[20%]">Perfil</th>
              <th className="px-6 py-4 font-semibold text-right w-[10%]">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-tinta/15 bg-papel-claro">
            {users.map((user) => (
              <tr key={user.idUser} className="hover:bg-papel transition-colors">
                <td className="px-6 py-4 font-medium text-tinta">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cobalto/10 to-cobalto/20 border border-cobalto/20 text-sm font-extrabold text-cobalto shadow-sm">
                      {user.nome.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-semibold text-tinta">{user.nome}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-aco font-mono text-xs">{user.email}</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center rounded-full bg-cobalto/10 px-2.5 py-1 text-xs font-semibold text-cobalto border border-cobalto/20">
                    {getRoleLabel(user.role || user.tipo_utilizador)}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => onEdit(user)}
                      className="rounded-xl bg-cobalto/10 px-3 py-1.5 text-xs font-bold text-cobalto border border-cobalto/20 hover:bg-cobalto hover:text-papel-claro hover:border-cobalto transition"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => setToDelete(user)}
                      className="rounded-xl bg-capa/10 px-3 py-1.5 text-xs font-bold text-capa-escura border border-capa/20 hover:bg-capa hover:text-papel-claro hover:border-capa transition"
                    >
                      Apagar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {toDelete && (
        <ConfirmDialog
          title="Apagar utilizador"
          message={`Tem a certeza que pretende apagar permanentemente o utilizador ${toDelete.nome}? Esta ação é irreversível.`}
          confirmLabel="Apagar definitivamente"
          cancelLabel="Cancelar"
          onCancel={() => setToDelete(null)}
          onConfirm={() => {
            onDisable(toDelete.idUser);
            setToDelete(null);
          }}
        />
      )}
    </div>
  );
};

export default UserList;
