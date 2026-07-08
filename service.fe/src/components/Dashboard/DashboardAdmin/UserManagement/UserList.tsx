import BtnGlobal from "../../../BtnGlobal";
import type { UserProfile } from "../../../../types/permissions";
import ConfirmDialog from "./ConfirmDialog";
import { useState } from "react";

interface Props {
  users: UserProfile[];
  loading: boolean;
  onEdit: (user: UserProfile) => void;
  onDisable: (id: string) => void;
}

const UserList = ({ users, loading, onEdit, onDisable }: Props) => {
  const [toDelete, setToDelete] = useState<UserProfile | null>(null);

  if (loading && users.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex items-center justify-center"></div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-slate-900">
          Lista de utilizadores
        </h2>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
          {users.length} registos
        </span>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {users.map((user) => (
              <tr key={user.idUser} className="hover:bg-slate-50">
                <td className="px-4 py-4 text-slate-900">{user.nome}</td>
                <td className="px-4 py-4 text-slate-600">{user.email}</td>
                <td className="px-4 py-4 text-slate-600 capitalize">
                  {user.role}
                </td>
                <td className="px-4 py-4 text-slate-600">
                  <div className="flex flex-wrap gap-2">
                    <BtnGlobal
                      onClick={() => onEdit(user)}
                      className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                    >
                      Editar
                    </BtnGlobal>
                    <BtnGlobal
                      variant="danger"
                      onClick={() => setToDelete(user)}
                      className="rounded-xl px-3 py-2 text-xs font-semibold"
                    >
                      Apagar
                    </BtnGlobal>
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
