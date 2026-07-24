import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { pacientesService, type Paciente } from "../../services/pacientes";
import { supabase } from "../../services/supabaseClient";
import BtnGlobal from "../BtnGlobal";

interface PacienteComTreinos extends Paciente {
  totalTreinos: number;
}

const PlanosCorpoClinico = () => {
  const [pacientes, setPacientes] = useState<PacienteComTreinos[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const navigate = useNavigate();

  const buscarPacientes = async () => {
    try {
      setLoading(true);
      setErro(null);
      
      const listaPacientes = await pacientesService.getPacientes();

      const { data: sessoesDados, error: errSessao } = await supabase
        .from("sessoes_realizadas")
        .select("id_paciente, status");

      if (errSessao) throw new Error(errSessao.message);

      const sessoesPorPaciente = new Map<string, number>();
      if (sessoesDados) {
        sessoesDados.forEach((sessao) => {
          if (sessao.status === "concluido" && sessao.id_paciente) {
            const count = sessoesPorPaciente.get(sessao.id_paciente) ?? 0;
            sessoesPorPaciente.set(sessao.id_paciente, count + 1);
          }
        });
      }

      const dadosMapeados = listaPacientes.map((p) => ({
        id_user: p.id_user,
        nome: p.nome,
        email: p.email,
        totalTreinos: sessoesPorPaciente.get(p.id_user) ?? 0,
      }));

      setPacientes(dadosMapeados);
    } catch (e) {
      setErro(
        e instanceof Error ? e.message : "Não foi possível carregar os pacientes.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void buscarPacientes();
  }, []);

  const totalTreinosGerais = useMemo(
    () => pacientes.reduce((total, p) => total + p.totalTreinos, 0),
    [pacientes],
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      {/* Cabeçalho: empilhado em mobile, em linha a partir de sm */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Acompanhamento de Pacientes
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Veja a lista de pacientes inscritos e acompanhe as suas atividades físicas.
          </p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <p className="text-sm font-semibold text-slate-500">
            Pacientes Acompanhados
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {pacientes.length}
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-500">Total de Treinos</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {totalTreinosGerais}
          </p>
        </div>
      </div>

      {erro && (
        <div className="mb-6 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
          {erro}
        </div>
      )}

      <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-6 py-4 font-semibold">Criança</th>
              <th className="px-6 py-4 font-semibold">Email</th>
              <th className="px-6 py-4 font-semibold text-center">Treinos Concluídos</th>
              <th className="px-6 py-4 font-semibold text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-8 text-center text-sm text-slate-500"
                >
                  A carregar pacientes…
                </td>
              </tr>
            ) : pacientes.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-8 text-center text-sm text-slate-500"
                >
                  Nenhum paciente encontrado.
                </td>
              </tr>
            ) : (
              pacientes.map((p) => {
                return (
                  <tr key={p.id_user} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {p.nome}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {p.email}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                        {p.totalTreinos} treinos
                      </span>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <BtnGlobal
                        variant="secondary"
                        onClick={() =>
                          navigate(
                            `/dashboard/medico/pacientes/${p.id_user}`,
                          )
                        }
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Ver detalhe
                      </BtnGlobal>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PlanosCorpoClinico;
