import { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import BtnGlobal from "../BtnGlobal";
import {
  planosService,
  type PlanoPorPaciente,
} from "../../services/planosService";
import type { UserProfile } from "../../types/user";

interface LayoutContext {
  user: UserProfile | null;
  handleLogin: (userProfile: UserProfile) => boolean;
  handleLogout: () => void;
}

const DashboardCorpoClinico = () => {
  const navigate = useNavigate();
  const { user } = useOutletContext<LayoutContext>();
  const displayName = user?.nome?.split(" ")[0] ?? "Colega";

  const [planos, setPlanos] = useState<PlanoPorPaciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const carregar = async () => {
      try {
        setLoading(true);
        setErro(null);
        const lista = await planosService.getPlanosPorPacientes();
        setPlanos(lista);
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

  const totalPlanosAtivos = useMemo(
    () =>
      planos.reduce(
        (total, p) => total + p.planos.filter((pl) => pl.ativo).length,
        0,
      ),
    [planos],
  );

  const totalPlanosInativos = useMemo(
    () =>
      planos.reduce(
        (total, p) => total + p.planos.filter((pl) => !pl.ativo).length,
        0,
      ),
    [planos],
  );

  const pacientesSemPlano = useMemo(
    () => planos.filter((p) => !p.planos.some((pl) => pl.ativo)).length,
    [planos],
  );

  return (
    <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        {/* Cabeçalho Gradiente que o Claude apagou */}
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
                Prescreva programas de exercício para crianças e jovens dos 6
                aos 18 anos, reveja protocolos e acompanhe o progresso diário.
              </p>
            </div>
            <div className="flex flex-col gap-3 rounded-3xl bg-papel-claro/10 px-4 py-4 text-right backdrop-blur-sm">
              <div>
                <p className="text-sm font-medium text-[#EAEFFF]">
                  Pacientes registados
                </p>
                <p className="mt-1 text-2xl font-bold">
                  {loading ? "…" : planos.length}
                </p>
              </div>
              <button
                onClick={() => navigate("/perfil")}
                className="rounded-xl border-2 border-tinta bg-papel-claro px-4 py-2 text-sm font-bold text-tinta shadow-[2px_2px_0_#141F3C] transition hover:bg-papel active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
              >
                Informação pessoal
              </button>
            </div>
          </div>
        </section>

        {/* As tuas 3 métricas novas e limpas */}
        <section className="grid gap-4 lg:grid-cols-3">
          <article className="rounded-2xl border border-tinta/15 bg-papel-claro p-5 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-tinta">
              Planos ativos
            </p>
            <p className="mt-4 text-3xl font-bold text-tinta">
              {loading ? "…" : totalPlanosAtivos}
            </p>
            <p className="mt-2 text-sm text-tinta/80">
              Programas de exercício em curso.
            </p>
          </article>

          <article className="rounded-2xl border border-tinta/15 bg-papel-claro p-5 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-tinta">
              Planos concluídos
            </p>
            <p className="mt-4 text-3xl font-bold text-tinta">
              {loading ? "…" : totalPlanosInativos}
            </p>
            <p className="mt-2 text-sm text-tinta/80">
              Histórico de planos finalizados ou cancelados.
            </p>
          </article>

          <article className="rounded-2xl border border-tinta/15 bg-papel-claro p-5 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-tinta">
              Sem plano ativo
            </p>
            <p className="mt-4 text-3xl font-bold text-tinta">
              {loading ? "…" : pacientesSemPlano}
            </p>
            <p className="mt-2 text-sm text-tinta/80">
              Pacientes que necessitam de prescrição.
            </p>
          </article>
        </section>

        {/* Tabela de pacientes e botões de ação que o Claude apagou */}
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
                onClick={() => navigate("/dashboard/medico/adesao")}
                className="rounded-xl bg-cobalto px-4 py-2.5 text-sm font-semibold text-papel shadow-sm hover:bg-cobalto"
              >
                Gerir planos
              </BtnGlobal>
            </div>

            {erro && (
              <div className="mt-4 rounded-2xl bg-capa/10 p-4 text-sm text-capa-escura">
                {erro}
              </div>
            )}

            <div className="mt-6 overflow-hidden rounded-3xl border border-tinta/15 bg-papel">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-papel-claro text-aco">
                  <tr>
                    <th className="px-4 py-4 font-semibold">Criança</th>
                    <th className="px-4 py-4 font-semibold">Planos totais</th>
                    <th className="px-4 py-4 font-semibold">Planos ativos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-tinta/15 bg-papel-claro">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-4 py-8 text-center text-aco"
                      >
                        A carregar pacientes…
                      </td>
                    </tr>
                  ) : planos.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-4 py-8 text-center text-aco"
                      >
                        Nenhum paciente encontrado.
                      </td>
                    </tr>
                  ) : (
                    planos.map((paciente) => {
                      const planosAtivos = paciente.planos.filter(
                        (p) => p.ativo,
                      ).length;

                      return (
                        <tr
                          key={paciente.id_paciente}
                          onClick={() =>
                            navigate(
                              `/dashboard/medico/pacientes/${paciente.id_paciente}`,
                            )
                          }
                          className="cursor-pointer transition hover:bg-cobalto/10"
                        >
                          <td className="px-4 py-4 font-semibold text-tinta">
                            {paciente.nome}
                          </td>
                          <td className="px-4 py-4 text-tinta">
                            {paciente.planos.length}
                          </td>
                          <td className="px-4 py-4 text-tinta">
                            {planosAtivos}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </article>

          <article className="rounded-3xl border border-tinta/15 bg-papel-claro p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-tinta">
                  Ações rápidas
                </h2>
                <p className="mt-1 text-sm text-aco">
                  Atalhos para o dia a dia.
                </p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              <BtnGlobal
                onClick={() => navigate("/plano/criar")}
                className="w-full rounded-xl bg-cobalto px-4 py-3 text-sm font-semibold text-papel hover:bg-cobalto"
              >
                Criar novo plano
              </BtnGlobal>
              <BtnGlobal
                onClick={() => navigate("/dashboard/medico/pacientes")}
                className="w-full rounded-xl bg-tinta px-4 py-3 text-sm font-semibold text-papel hover:bg-tinta"
              >
                Gerir planos de pacientes
              </BtnGlobal>
              <BtnGlobal
                onClick={() => navigate("/exercicios")}
                className="w-full rounded-xl border border-tinta/15 bg-papel-claro px-4 py-3 text-sm font-semibold !text-tinta hover:bg-papel"
              >
                Biblioteca de exercícios
              </BtnGlobal>
            </div>
          </article>
        </section>
      </div>
    </div>
  );
};

export default DashboardCorpoClinico;
