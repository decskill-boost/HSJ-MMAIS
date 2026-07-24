import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "../LoadingSpinner";
import { pacientesService } from "../../services/pacientes";
import { supabase } from "../../services/supabaseClient";

interface PacienteAcompanhado {
  id_user: string;
  nome: string;
  email: string;
  totalTreinos: number;
}

const PlanosCorpoClinico = () => {
  const navigate = useNavigate();
  const [pacientes, setPacientes] = useState<PacienteAcompanhado[]>([]);
  const [totalTreinosGerais, setTotalTreinosGerais] = useState(0);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [pesquisa, setPesquisa] = useState("");

  useEffect(() => {
    const carregarDados = async () => {
      try {
        setLoading(true);
        setErro(null);

        // Obter todos os pacientes
        const listaPacientes = await pacientesService.getPacientes();

        // Obter todas as sessões realizadas com status 'concluido'
        const { data: sessoes, error: errSessoes } = await supabase
          .from("sessoes_realizadas")
          .select("id_paciente")
          .eq("status", "concluido");

        if (errSessoes) throw new Error(errSessoes.message);

        // Mapear contagem de treinos concluídos por paciente
        const sessoesContador = new Map<string, number>();
        let totalTreinos = 0;

        if (sessoes) {
          sessoes.forEach((s) => {
            if (s.id_paciente) {
              const atual = sessoesContador.get(s.id_paciente) ?? 0;
              sessoesContador.set(s.id_paciente, atual + 1);
              totalTreinos++;
            }
          });
        }

        const pacientesMapeados = listaPacientes.map((p) => ({
          ...p,
          totalTreinos: sessoesContador.get(p.id_user) ?? 0,
        }));

        setPacientes(pacientesMapeados);
        setTotalTreinosGerais(totalTreinos);
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
        setErro(
          err instanceof Error
            ? err.message
            : "Ocorreu um erro ao carregar os dados de acompanhamento.",
        );
      } finally {
        setLoading(false);
      }
    };

    void carregarDados();
  }, []);

  const termo = pesquisa.trim().toLowerCase();
  const pacientesFiltrados = termo
    ? pacientes.filter(
        (p) =>
          p.nome.toLowerCase().includes(termo) ||
          p.email.toLowerCase().includes(termo),
      )
    : pacientes;

  return (
    <div className="flex-1 bg-papel px-4 py-6 sm:px-6 lg:px-8">
      {/* Cabeçalho */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-tinta">
            Acompanhamento de Pacientes
          </h1>
          <p className="mt-1 text-sm text-aco">
            Veja a lista de pacientes inscritos e acompanhe as suas atividades físicas.
          </p>
        </div>
      </div>

      {/* Estatísticas Gerais */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-tinta/15 bg-papel-claro p-5 shadow-sm">
        <div>
          <p className="text-sm font-semibold text-aco">
            Pacientes Acompanhados
          </p>
          <p className="mt-1 text-2xl font-bold text-tinta">
            {loading ? "…" : pacientes.length}
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-aco">Total de Treinos</p>
          <p className="mt-1 text-2xl font-bold text-tinta">
            {loading ? "…" : totalTreinosGerais}
          </p>
        </div>
      </div>

      {erro && (
        <div className="mb-6 rounded-2xl bg-capa/10 p-4 text-sm text-capa-escura">
          {erro}
        </div>
      )}

      {/* Pesquisa — com muitos pacientes, percorrer a lista à mão é impraticável */}
      <div className="mb-4">
        <label htmlFor="pesquisa-paciente" className="sr-only">
          Pesquisar paciente
        </label>
        <input
          id="pesquisa-paciente"
          type="search"
          value={pesquisa}
          onChange={(e) => setPesquisa(e.target.value)}
          placeholder="Pesquisar por nome ou email…"
          className="w-full max-w-md rounded-xl border border-tinta/15 bg-papel-claro px-4 py-2.5 text-sm text-tinta placeholder:text-aco focus:border-cobalto focus:outline-none focus:ring-2 focus:ring-cobalto/20"
        />
      </div>

      {/* Listagem */}
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
                  colSpan={4}
                  className="px-6 py-8 text-center text-sm text-aco"
                >
                  <LoadingSpinner mensagem="A carregar pacientes..." />
                </td>
              </tr>
            ) : pacientesFiltrados.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-8 text-center text-sm text-aco"
                >
                  {pesquisa
                    ? `Nenhum paciente encontrado para "${pesquisa}".`
                    : "Nenhum paciente encontrado."}
                </td>
              </tr>
            ) : (
              pacientesFiltrados.map((p) => {
                return (
                  <tr key={p.id_user} className="hover:bg-papel">
                    <td className="px-6 py-4 font-semibold text-tinta">
                      {p.nome}
                    </td>
                    <td className="px-6 py-4 text-aco">
                      {p.email}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center rounded-full bg-cobalto/10 px-3 py-1 text-xs font-semibold text-cobalto">
                        {p.totalTreinos} treinos
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() =>
                            navigate(`/plano/criar?paciente=${p.id_user}`)
                          }
                          className="rounded-(--radius-vinheta) border-[3px] border-tinta bg-cobalto px-4 py-2 text-xs font-bold text-papel shadow-vinheta transition hover:bg-cobalto-vivo active:scale-95 active:shadow-none"
                        >
                          Atribuir plano
                        </button>
                        <button
                          onClick={() =>
                            navigate(`/dashboard/medico/pacientes/${p.id_user}`)
                          }
                          className="rounded-(--radius-vinheta) border-[3px] border-tinta bg-papel-claro px-4 py-2 text-xs font-bold text-tinta shadow-vinheta transition hover:bg-papel active:scale-95 active:shadow-none"
                        >
                          Ver detalhe
                        </button>
                      </div>
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
