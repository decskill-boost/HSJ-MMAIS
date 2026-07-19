import { useEffect, useMemo, useState } from "react";

import {
  createUser,
  disableUser,
  fetchUsers,
  updateUser,
} from "../../../../services/userService";
import { UserRole, type UserProfile } from "../../../../types/permissions";
import UserList from "./UserList";
import UserForm from "./UserForm";

type UserFormData = {
  nome: string;
  email: string;
  password: string;
  tipo_utilizador: UserRole;
};

const ROLES: { value: UserRole; label: string }[] = [
  { value: UserRole.CORPO_CLINICO, label: "Corpo Clínico" },
  { value: UserRole.PACIENTE, label: "Paciente" },
];

const initialForm: UserFormData = {
  nome: "",
  email: "",
  password: "",
  tipo_utilizador: UserRole.PACIENTE,
};

const UserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<UserFormData>(initialForm);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "create">("list");

  const selectedUser = useMemo(
    () => users.find((user) => user.idUser === editingUserId) ?? null,
    [editingUserId, users],
  );

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
      setError("Não foi possível carregar a lista de utilizadores.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedUser) {
      setForm({
        nome: selectedUser.nome,
        email: selectedUser.email,
        password: "",
        tipo_utilizador: selectedUser.role,
      });
    }
  }, [selectedUser]);

  const resetForm = () => {
    setEditingUserId(null);
    setForm(initialForm);
    setError(null);
    setMessage(null);
  };

  const handleSubmit = async (payload: {
    nome: string;
    email: string;
    password?: string;
    tipo_utilizador: UserRole;
  }) => {
    if (
      !payload.nome ||
      !payload.email ||
      (!editingUserId && !payload.password)
    ) {
      setError("Preencha todos os campos obrigatórios.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (editingUserId) {
        await updateUser(editingUserId, {
          nome: payload.nome,
          email: payload.email,
          tipo_utilizador: payload.tipo_utilizador,
        });
        setMessage("Utilizador atualizado com sucesso.");
      } else {
        await createUser({
          nome: payload.nome,
          email: payload.email,
          password: payload.password ?? "",
          tipo_utilizador: payload.tipo_utilizador,
        });
        setMessage("Utilizador criado com sucesso.");
      }
      await loadUsers();
      resetForm();
    } catch (err: unknown) {
      console.error(err);
      // Mostrar mensagem mais informativa quando disponível (Axios)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const anyErr = err as any;
      const serverMessage =
        anyErr?.response?.data?.message ||
        anyErr?.response?.data ||
        anyErr?.message;
      setError(
        typeof serverMessage === "string"
          ? serverMessage
          : JSON.stringify(serverMessage),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: UserProfile) => {
    setEditingUserId(user.idUser);
    setForm({
      nome: user.nome,
      email: user.email,
      password: "",
      tipo_utilizador: user.role,
    });
    setError(null);
    setMessage(null);
    setView("create");
  };

  const handleDisable = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await disableUser(id);
      setMessage("Utilizador desativado com sucesso.");
      await loadUsers();
      resetForm();
    } catch (err) {
      console.error(err);
      setError("Erro ao desativar o utilizador.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-papel px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="flex items-center justify-start gap-3">
          <button
            type="button"
            onClick={() => setView("list")}
            className={`rounded-2xl px-4 py-2 text-sm font-medium focus:outline-none ${
              view === "list"
                ? "bg-cobalto text-papel"
                : "bg-papel-claro text-tinta border border-tinta/15"
            }`}
          >
            Todos os utilizadores
          </button>
          <button
            type="button"
            onClick={() => {
              resetForm();
              setView("create");
            }}
            className={`rounded-2xl px-4 py-2 text-sm font-medium focus:outline-none ${
              view === "create"
                ? "bg-cobalto text-papel"
                : "bg-papel-claro text-tinta border border-tinta/15"
            }`}
          >
            Criar utilizador
          </button>
        </div>

        {view === "list" ? (
          <section className="grid gap-6">
            <div>
              <UserList
                users={users}
                loading={loading}
                onEdit={handleEdit}
                onDisable={handleDisable}
              />
            </div>
          </section>
        ) : (
          <section className="grid gap-6">
            <div>
              <UserForm
                form={form}
                setForm={setForm}
                editingUserId={editingUserId}
                onSubmit={handleSubmit}
                onCancel={() => {
                  resetForm();
                }}
                loading={loading}
                message={message}
                error={error}
                roles={ROLES}
              />
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
