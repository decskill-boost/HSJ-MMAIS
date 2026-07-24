import BtnGlobal from "../../../BtnGlobal";
import type { UserRole } from "../../../../types/permissions";

type UserFormData = {
  nome: string;
  email: string;
  password: string;
  tipo_utilizador: UserRole;
};

interface Props {
  form: UserFormData;
  setForm: (f: UserFormData) => void;
  editingUserId: string | null;
  onSubmit: (payload: {
    nome: string;
    email: string;
    password?: string;
    tipo_utilizador: UserRole;
  }) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  message: string | null;
  error: string | null;
  roles: { value: UserRole; label: string }[];
}

const UserForm = ({
  form,
  setForm,
  editingUserId,
  onSubmit,
  onCancel,
  loading,
  message,
  error,
  roles,
}: Props) => {
  return (
    <div className="h-fit rounded-3xl border border-tinta/15 bg-papel-claro p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-tinta">
        {editingUserId ? "Editar utilizador" : "Criar novo utilizador"}
      </h2>
      <p className="mt-2 text-sm text-aco">
        Os utilizadores criados aqui serão gravados no Supabase e no perfil da
        base de dados.
      </p>

      <form
        className="mt-6 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void onSubmit(form);
        }}
      >
        <div>
          <label className="block text-sm font-semibold text-tinta">
            Nome
          </label>
          <input
            value={form.nome}
            onChange={(event) => setForm({ ...form, nome: event.target.value })}
            disabled={loading}
            className="mt-2 block w-full rounded-2xl border border-tinta/15 bg-papel px-4 py-2 text-tinta focus:border-cobalto focus:bg-papel-claro focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-tinta">
            Email
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(event) =>
              setForm({ ...form, email: event.target.value })
            }
            disabled={loading}
            className="mt-2 block w-full rounded-2xl border border-tinta/15 bg-papel px-4 py-2 text-tinta focus:border-cobalto focus:bg-papel-claro focus:outline-none"
          />
        </div>
        {!editingUserId && (
          <div>
            <label className="block text-sm font-semibold text-tinta">
              Password
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(event) =>
                setForm({ ...form, password: event.target.value })
              }
              disabled={loading}
              className="mt-2 block w-full rounded-2xl border border-tinta/15 bg-papel px-4 py-2 text-tinta focus:border-cobalto focus:bg-papel-claro focus:outline-none"
            />
          </div>
        )}
        <div>
          <label className="block text-sm font-semibold text-tinta">
            Perfil
          </label>
          <select
            value={form.tipo_utilizador}
            onChange={(event) =>
              setForm({
                ...form,
                tipo_utilizador: event.target.value as UserRole,
              })
            }
            disabled={loading}
            className="mt-2 block w-full rounded-2xl border border-tinta/15 bg-papel px-4 py-2 text-tinta focus:border-cobalto focus:bg-papel-claro focus:outline-none"
          >
            {roles.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </div>

        {message && (
          <div className="rounded-xl bg-turbo/10 px-4 py-3 text-sm text-turbo-escuro">
            {message}
          </div>
        )}
        {error && (
          <div className="rounded-xl bg-capa/10 px-4 py-3 text-sm text-capa-escura">
            {error}
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <BtnGlobal type="submit" isLoading={loading}>
            {editingUserId ? "Atualizar utilizador" : "Criar utilizador"}
          </BtnGlobal>
          {editingUserId && (
            <BtnGlobal
              type="button"
              variant="secondary"
              onClick={onCancel}
              className="rounded-xl px-4 py-2"
            >
              Cancelar
            </BtnGlobal>
          )}
        </div>
      </form>
    </div>
  );
};

export default UserForm;
