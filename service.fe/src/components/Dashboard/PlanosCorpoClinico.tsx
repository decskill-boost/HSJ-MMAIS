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
          <h1 className="text-2xl font-extrabold tracking-tight text-tinta">
            Gestão de planos clínicos
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Acompanhamento de Pacientes
          </h1>
          <p className="mt-1 text-sm text-aco">
            Veja todos os pacientes, o plano atual e assinale novos planos
            quando necessário.
          <p className="mt-1 text-sm text-slate-500">
            Veja a lista de pacientes inscritos e acompanhe as suas atividades físicas.
          </p>
        </div>
        <BtnGlobal
          onClick={() => navigate("/plano/criar")}
          className="w-full rounded-xl bg-cobalto px-4 py-3 text-sm text-papel hover:bg-cobalto sm:w-auto"
        >
          Criar plano novo
        </BtnGlobal>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-tinta/15 bg-papel-claro p-5 shadow-sm">
        <div>
          <p className="text-sm font-semibold text-aco">
            Pacientes listados
          <p className="text-sm font-semibold text-slate-500">
            Pacientes Acompanhados
          </p>
          <p className="mt-1 text-2xl font-bold text-tinta">
            {planos.length}
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {pacientes.length}
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-aco">Planos ativos</p>
          <p className="mt-1 text-2xl font-bold text-tinta">
            {totalPlanosAtivos}
          <p className="text-sm font-semibold text-slate-500">Total de Treinos</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {totalTreinosGerais}
          </p>
        </div>
      </div>

      {erro && (
        <div className="mb-6 rounded-2xl bg-capa/10 p-4 text-sm text-capa-escura">
          {erro}
        </div>
      )}

      <div className="overflow-x-auto rounded-3xl border border-tinta/15 bg-papel-claro shadow-sm">
        <table className="min-w-full divide-y divide-tinta/15 text-left text-sm">
          <thead className="bg-papel text-aco">
            <tr>
              <th className="px-6 py-4 font-semibold">Criança</th>
              <th className="px-6 py-4 font-semibold">Email</th>
              <th className="px-6 py-4 font-semibold text-center">Treinos Concluídos</th>
              <th className="px-6 py-4 font-semibold text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-tinta/10">
            {loading ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-8 text-center text-sm text-aco"
                  colSpan={4}
                  className="px-6 py-8 text-center text-sm text-slate-500"
                >
                  A carregar pacientes…
                </td>
              </tr>
            ) : pacientes.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-8 text-center text-sm text-aco"
                  colSpan={4}
                  className="px-6 py-8 text-center text-sm text-slate-500"
                >
                  Nenhum paciente encontrado.
                </td>
              </tr>
            ) : (
              pacientes.map((p) => {
                return (
                  <tr key={paciente.id_paciente} className="hover:bg-papel">
                    <td className="px-6 py-4 font-semibold text-tinta">
                      {paciente.nome}
                  <tr key={p.id_user} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {p.nome}
                    </td>

                    {/* Planos Ativos */}
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                          temPlanoAtivo
                            ? "bg-turbo/10 text-turbo-escuro ring-turbo-escuro/10"
                            : "bg-papel text-aco ring-aco/10"
                        }`}
                      >
                        {planosAtivos.length}{" "}
                        {planosAtivos.length === 1 ? "ativo" : "ativos"}
                      </span>
                    <td className="px-6 py-4 text-slate-600">
                      {p.email}
                    </td>

                    {/* Planos Totais */}
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center rounded-md bg-papel px-2 py-1 text-xs font-medium text-aco ring-1 ring-inset ring-aco/10">
                        {planosTotais} {planosTotais === 1 ? "total" : "totais"}
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                        {p.totalTreinos} treinos
                      </span>
                    </td>

                    <td className="px-4 py-4 text-tinta">
                      {formatarData(
                        (paciente as any).data_criacao ??
                          planoMaisRecente?.data_inicio,
                      )}
                    </td>

                    {/* Ações — alinhadas à esquerda, empilham em ecrãs muito pequenos */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:whitespace-nowrap">
                        <BtnGlobal
                          onClick={() =>
                            navigate(
                              `/plano/criar?paciente=${paciente.id_paciente}`,
                            )
                          }
                          className="rounded-xl bg-tinta px-3 py-2 text-xs text-papel hover:bg-tinta"
                        >
                          Atribuir novo plano
                        </BtnGlobal>

                        <BtnGlobal
                          variant="secondary"
                          onClick={() =>
                            navigate(
                              `/dashboard/medico/pacientes/${paciente.id_paciente}`,
                            )
                          }
                          className="rounded-xl border border-tinta/15 bg-papel-claro px-3 py-2 text-xs font-semibold text-tinta hover:bg-papel"
                        >
                          Ir para detalhados
                        </BtnGlobal>
                      </div>
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
