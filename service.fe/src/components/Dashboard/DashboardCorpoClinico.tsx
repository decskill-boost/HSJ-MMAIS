import { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import BtnGlobal from "../BtnGlobal";
import type { UserProfile } from "../../types/user";
import LoadingSpinner from "../LoadingSpinner";
import { pacientesService } from "../../services/pacientes";
import { supabase } from "../../services/supabaseClient";

interface LayoutContext {
  user: UserProfile | null;
  handleLogin: (userProfile: UserProfile) => boolean;
  handleLogout: () => void;
}

interface PacienteComUltimoTreino {
  id_user: string;
  nome: string;
  email: string;
  ultimoTreino: string;
  ultimoTreinoDate: Date | null;
}

const DashboardCorpoClinico = () => {
  const navigate = useNavigate();
  const { user } = useOutletContext<LayoutContext>();
  const displayName = user?.nome?.split(" ")[0] ?? "Colega";

  const [pacientes, setPacientes] = useState<PacienteComUltimoTreino[]>([]);
  const [totalTreinos, setTotalTreinos] = useState(0);
  const [treinosSemana, setTreinosSemana] = useState(0);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const paginatedPacientes = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return pacientes.slice(startIndex, startIndex + itemsPerPage);
  }, [pacientes, currentPage]);

  const totalPaginas = Math.ceil(pacientes.length / itemsPerPage);

  useEffect(() => {
    const carregar = async () => {
      try {
        setLoading(true);
        setErro(null);
        
        const listaPacientes = await pacientesService.getPacientes();

        const { data: sessoesDados, error: errSessao } = await supabase
          .from("sessoes_realizadas")
          .select("id_paciente, status, data_hora")
          .eq("status", "concluido");

        if (errSessao) throw new Error(errSessao.message);

        const sessoesPorPaciente = new Map<string, Date>();
        let totalConcluidos = 0;
        let concluidosSemana = 0;

        const seteDiasAtras = new Date();
        seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);

        if (sessoesDados) {
          sessoesDados.forEach((s) => {
            totalConcluidos++;
            const sessaoDate = new Date(s.data_hora);
            if (sessaoDate >= seteDiasAtras) {
              concluidosSemana++;
            }
            if (s.id_paciente) {
              const existente = sessoesPorPaciente.get(s.id_paciente);
              if (!existente || sessaoDate > existente) {
                sessoesPorPaciente.set(s.id_paciente, sessaoDate);
              }
            }
          });
        }

        const formatarDataExibicao = (data: Date) => {
          return data.toLocaleString("pt-PT", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
        };

        const mapeados = listaPacientes.map((p) => {
          const ultimoDate = sessoesPorPaciente.get(p.id_user) ?? null;
          return {
            id_user: p.id_user,
            nome: p.nome,
            email: p.email,
            ultimoTreino: ultimoDate ? formatarDataExibicao(ultimoDate) : "Nunca treinou",
            ultimoTreinoDate: ultimoDate,
          };
        });

        setPacientes(mapeados);
        setTotalTreinos(totalConcluidos);
        setTreinosSemana(concluidosSemana);
      } catch (e) {
        setErro(
          e instanceof Error
            ? e.message
            : "Não foi possível carregar os dados.",
        );
      } finally {
        setLoading(false);
      }
    };

    void carregar();
  }, []);

  return (
    <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        {/* Cabeçalho */}
        <section className="rounded-3xl border border-tinta/15 bg-gradient-to-br from-cobalto to-tinta p-6 text-papel shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#EAEFFF]">
                Painel do Corpo Clínico
              </p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Olá, Dr. {displayName}
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-[#EAEFFF] sm:text-base">
                Acompanhe o progresso das crianças, reveja protocolos e monitorize atividades físicas.
              </p>
            </div>
            <div className="flex flex-col gap-3 rounded-3xl bg-papel/10 px-4 py-4 text-right backdrop-blur-sm">
              <div>
                <p className="text-sm font-medium text-[#EAEFFF]">
                  Pacientes registados
                </p>
                <p className="mt-1 text-2xl font-bold">
                  {loading ? "…" : pacientes.length}
                </p>
              </div>
              <BtnGlobal
                variant="secondary"
                onClick={() => navigate("/perfil")}
                className="rounded-xl border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Informação pessoal
              </BtnGlobal>
            </div>
          </div>
        </section>

        {/* Métricas */}
        <section className="grid gap-4 lg:grid-cols-3">
          <article className="rounded-2xl border border-tinta/15 bg-papel-claro p-5 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-tinta">
              Pacientes Acompanhados
            </p>
            <p className="mt-4 text-3xl font-bold text-tinta">
              {loading ? "…" : pacientes.length}
            </p>
            <p className="mt-2 text-sm text-tinta/80">
              Crianças e jovens em acompanhamento.
            </p>
          </article>

          <article className="rounded-2xl border border-tinta/15 bg-papel-claro p-5 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-tinta">
              Total de Treinos
            </p>
            <p className="mt-4 text-3xl font-bold text-tinta">
              {loading ? "…" : totalTreinos}
            </p>
            <p className="mt-2 text-sm text-tinta/80">
              Sessões concluídas com sucesso.
            </p>
          </article>

          <article className="rounded-2xl border border-tinta/15 bg-papel-claro p-5 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-tinta">
              Treinos esta Semana
            </p>
            <p className="mt-4 text-3xl font-bold text-tinta">
              {loading ? "…" : treinosSemana}
            </p>
            <p className="mt-2 text-sm text-tinta/80">
              Sessões concluídas nos últimos 7 dias.
            </p>
          </article>
        </section>

        {/* Tabela de pacientes e ações rápidas */}
        <section className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
          <article className="rounded-3xl border border-tinta/15 bg-papel-claro p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-tinta">Pacientes</h2>
                <p className="mt-1 text-sm text-aco">
                  Clique numa linha para ver o detalhe do paciente.
                </p>
              </div>
              <BtnGlobal
                onClick={() => navigate("/dashboard/medico/pacientes")}
                className="px-4 py-2.5 text-sm font-semibold"
              >
                Ver Pacientes
              </BtnGlobal>
            </div>

            {erro && (
              <div className="mt-4 rounded-2xl bg-capa/10 p-4 text-sm text-capa-escura">
                {erro}
              </div>
            )}

            <div className="mt-6 overflow-x-auto rounded-3xl border border-tinta/15 bg-papel">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-papel-claro text-aco">
                  <tr>
                    <th className="px-4 py-4 font-semibold">Criança</th>
                    <th className="px-4 py-4 text-center font-semibold">Último Treino</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-tinta/15 bg-papel-claro">
                  {loading ? (
                    <tr>
                      <td colSpan={2} className="px-4 py-8">
                        <LoadingSpinner mensagem="A carregar pacientes..." />
                      </td>
                    </tr>
                  ) : pacientes.length === 0 ? (
                    <tr>
                      <td
                        colSpan={2}
                        className="px-4 py-8 text-center text-aco"
                      >
                        Nenhum paciente encontrado.
                      </td>
                    </tr>
                  ) : (
                    paginatedPacientes.map((paciente) => (
                      <tr
                        key={paciente.id_user}
                        onClick={() =>
                          navigate(
                            `/dashboard/medico/pacientes/${paciente.id_user}`,
                          )
                        }
                        className="cursor-pointer transition hover:bg-cobalto/10"
                      >
                        <td className="px-4 py-4 font-semibold text-tinta">
                          {paciente.nome}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                            paciente.ultimoTreinoDate
                              ? "border-turbo/30 bg-turbo/15 text-turbo-escuro"
                              : "border-tinta/15 bg-tinta/5 text-aco"
                          }`}>
                            {paciente.ultimoTreino}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {totalPaginas > 1 && (
              <div className="mt-4 flex items-center justify-between gap-4 border-t border-tinta/10 pt-4">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => prev - 1)}
                  className="rounded-xl border border-tinta/15 bg-papel-claro px-3 py-1.5 text-xs font-semibold text-tinta transition hover:bg-papel disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Anterior
                </button>
                <span className="text-xs font-medium text-aco">
                  Página {currentPage} de {totalPaginas}
                </span>
                <button
                  disabled={currentPage === totalPaginas}
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                  className="rounded-xl border border-tinta/15 bg-papel-claro px-3 py-1.5 text-xs font-semibold text-tinta transition hover:bg-papel disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Seguinte
                </button>
              </div>
            )}
          </article>

          <article className="rounded-3xl border border-tinta/15 bg-papel-claro p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-tinta">Ações rápidas</h2>
                <p className="mt-1 text-sm text-aco">Atalhos para o dia a dia.</p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              <button
                onClick={() => navigate("/plano/criar")}
                className="w-full rounded-(--radius-vinheta) border-[3px] border-tinta bg-cobalto px-4 py-3 text-sm font-bold text-papel shadow-vinheta transition hover:bg-cobalto-vivo active:scale-95 active:shadow-none"
              >
                Criar novo plano
              </button>
              <button
                onClick={() => navigate("/dashboard/medico/pacientes")}
                className="w-full rounded-(--radius-vinheta) border-[3px] border-tinta bg-tinta px-4 py-3 text-sm font-bold text-papel shadow-vinheta transition hover:bg-tinta/90 active:scale-95 active:shadow-none"
              >
                Acompanhar Pacientes
              </button>
              <button
                onClick={() => navigate("/exercicios")}
                className="w-full rounded-(--radius-vinheta) border-[3px] border-tinta bg-papel-claro px-4 py-3 text-sm font-bold text-tinta shadow-vinheta transition hover:bg-papel active:scale-95 active:shadow-none"
              >
                Biblioteca de exercícios
              </button>
            </div>
          </article>
        </section>
      </div>
    </div>
  );
};

export default DashboardCorpoClinico;
