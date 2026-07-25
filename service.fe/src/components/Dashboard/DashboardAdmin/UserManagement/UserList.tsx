import { useState } from "react";
import type { UserProfile } from "../../../../types/permissions";
import ConfirmDialog from "../../../ui/ConfirmDialog";
import BtnGlobal from "../../../BtnGlobal";
import LoadingSpinner from "../../../LoadingSpinner";
import EstadoVazio from "../../../ui/EstadoVazio";
import {
  CabecaTabela,
  CorpoTabela,
  Tabela,
  Th,
} from "../../../ui/Tabela";

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

  return (
    <div className="painel p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl tracking-wide text-tinta">
            Lista de utilizadores
          </h2>
          <p className="mt-1 text-sm text-aco">
            Faça a gestão das contas de acesso à plataforma.
          </p>
        </div>
        <span className="rounded-full border-2 border-tinta bg-raio px-3 py-1 text-xs font-bold text-tinta">
          {users.length} {users.length === 1 ? "registo" : "registos"}
        </span>
      </div>

      {loading && users.length === 0 ? (
        <LoadingSpinner mensagem="A carregar utilizadores..." />
      ) : users.length === 0 ? (
        <EstadoVazio
          titulo="Ainda não há contas"
          descricao="Crie a primeira conta de acesso para começar a povoar a Academia."
        />
      ) : (
        <Tabela legenda="Contas de acesso à plataforma">
          <CabecaTabela>
            <tr>
              <Th>Nome</Th>
              <Th>Email</Th>
              <Th>Perfil</Th>
              {/* Largura fixa: com percentagens os dois botões partiam-se em
                  duas linhas e a linha da tabela duplicava de altura. */}
              <Th className="w-56 text-right">Ações</Th>
            </tr>
          </CabecaTabela>
          <CorpoTabela>
            {users.map((user) => (
              <tr key={user.idUser} className="transition-colors hover:bg-raio/15">
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-tinta bg-cobalto-nevoa text-sm font-bold text-cobalto"
                    >
                      {user.nome.charAt(0).toUpperCase()}
                    </span>
                    <span className="font-bold text-tinta">{user.nome}</span>
                  </div>
                </td>
                <td className="px-4 py-4 text-aco">{user.email}</td>
                <td className="px-4 py-4">
                  <span className="inline-flex rounded-full border-2 border-cobalto bg-cobalto-nevoa px-3 py-1 text-xs font-bold text-cobalto">
                    {getRoleLabel(user.role || user.tipo_utilizador)}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex justify-end gap-2 whitespace-nowrap">
                    <BtnGlobal variant="secondary" onClick={() => onEdit(user)}>
                      Editar
                    </BtnGlobal>
                    <BtnGlobal variant="danger" onClick={() => setToDelete(user)}>
                      Apagar
                    </BtnGlobal>
                  </div>
                </td>
              </tr>
            ))}
          </CorpoTabela>
        </Tabela>
      )}

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
