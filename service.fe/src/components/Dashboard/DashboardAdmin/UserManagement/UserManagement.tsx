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
  const [pesquisa, setPesquisa] = useState("");
  const [filtroPerfil, setFiltroPerfil] = useState<UserRole | "todos">("todos");

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
      let serverMessage = "Erro desconhecido";
      if (err instanceof Error) {
        serverMessage = err.message;
      }
      const apiErr = err as { response?: { data?: { message?: string } | string } };
      if (apiErr?.response?.data) {
        const data = apiErr.response.data;
        if (typeof data === "string") {
          serverMessage = data;
        } else if (data && typeof data === "object" && "message" in data && typeof data.message === "string") {
          serverMessage = data.message;
        }
      }
      setError(serverMessage);
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

  // Pesquisa e filtro por perfil — com muitas contas, percorrer a lista à mão
  // era impraticável.
  const termo = pesquisa.trim().toLowerCase();
  const usersVisiveis = users.filter((u) => {
    if (filtroPerfil !== "todos" && u.role !== filtroPerfil) return false;
    if (!termo) return true;
    return (
      u.nome.toLowerCase().includes(termo) ||
      u.email.toLowerCase().includes(termo)
    );
  });

  // A criar/editar, o formulário é o ecrã — sem separadores
  if (view === "create") {
    return (
      <UserForm
        form={form}
        setForm={setForm}
        editingUserId={editingUserId}
        onSubmit={handleSubmit}
        onCancel={() => {
          resetForm();
          setView("list");
        }}
        loading={loading}
        message={message}
        error={error}
        roles={ROLES}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Barra de ferramentas: pesquisar, filtrar e criar */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={pesquisa}
          onChange={(e) => setPesquisa(e.target.value)}
          placeholder="Pesquisar por nome ou email…"
          className="min-w-[220px] flex-1 rounded-xl border border-tinta/15 bg-papel-claro px-4 py-2.5 text-sm text-tinta placeholder:text-aco focus:border-cobalto focus:outline-none focus:ring-2 focus:ring-cobalto/20"
        />
        <select
          value={filtroPerfil}
          onChange={(e) =>
            setFiltroPerfil(e.target.value as UserRole | "todos")
          }
          className="rounded-xl border border-tinta/15 bg-papel-claro px-3 py-2.5 text-sm font-semibold text-tinta focus:border-cobalto focus:outline-none focus:ring-2 focus:ring-cobalto/20"
        >
          <option value="todos">Todos os perfis</option>
          <option value={UserRole.ADMIN}>Administrador</option>
          <option value={UserRole.CORPO_CLINICO}>Corpo Clínico</option>
          <option value={UserRole.PACIENTE}>Paciente</option>
        </select>
        <button
          type="button"
          onClick={() => {
            resetForm();
            setView("create");
          }}
          className="flex items-center gap-2 rounded-(--radius-vinheta) border-[3px] border-tinta bg-cobalto px-4 py-2.5 text-sm font-bold text-papel shadow-vinheta transition hover:bg-cobalto-vivo active:scale-95 active:shadow-none"
        >
          <span className="text-lg leading-none">+</span> Criar utilizador
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border-2 border-capa/30 bg-capa/10 p-4 text-sm font-medium text-capa-escura">
          {error}
        </div>
      )}
      {message && (
        <div className="rounded-2xl border-2 border-turbo/30 bg-turbo/10 p-4 text-sm font-medium text-turbo-escuro">
          {message}
        </div>
      )}

      <UserList
        users={usersVisiveis}
        loading={loading}
        onEdit={handleEdit}
        onDisable={handleDisable}
      />
    </div>
  );
};

export default UserManagement;
