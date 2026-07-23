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
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex items-center justify-center min-h-[200px]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Lista de utilizadores
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Gerencie as contas de acesso à plataforma.
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
          {users.length} registos
        </span>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-150">
        <table className="min-w-full divide-y divide-slate-150 text-left text-sm">
          <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-6 py-4 font-semibold w-[35%]">Nome</th>
              <th className="px-6 py-4 font-semibold w-[35%]">Email</th>
              <th className="px-6 py-4 font-semibold w-[20%]">Perfil</th>
              <th className="px-6 py-4 font-semibold text-right w-[10%]">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {users.map((user) => (
              <tr key={user.idUser} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 text-sm font-extrabold text-blue-600 shadow-sm">
                      {user.nome.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-semibold text-slate-900">{user.nome}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-600 font-mono text-xs">{user.email}</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center rounded-full bg-blue-50/50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-100/50">
                    {getRoleLabel(user.role || user.tipo_utilizador)}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => onEdit(user)}
                      className="rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-600 border border-blue-100 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => setToDelete(user)}
                      className="rounded-xl bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 border border-red-100 hover:bg-red-600 hover:text-white hover:border-red-600 transition"
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
