import { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import BtnGlobal from "../BtnGlobal";
import {
  planosService,
  type PlanoPorPaciente,
} from "../../services/planosService";
import type { UserProfile } from "../../types/user";
import { supabase } from "../../services/supabaseClient";

interface LayoutContext {
  user: UserProfile | null;
  handleLogin: (userProfile: UserProfile) => boolean;
  handleLogout: () => void;
}

interface UltimaSessao {
  id_paciente: string;
  data_hora: string;
  esforco_1_a_10: number | null;
  diversao_1_a_5: number | null;
  fc_media: number | null;
  fc_maxima: number | null;
  teve_problemas: boolean;
}

const renderEsforco = (esforco: number | null | undefined) => {
  if (esforco === null || esforco === undefined) {
    return <span className="font-medium text-slate-400">-</span>;
  }
  let colorClass = "bg-emerald-50 text-emerald-700 border-emerald-100";
  if (esforco >= 8) {
    colorClass = "bg-rose-50 text-rose-700 border-rose-100";
  } else if (esforco >= 4) {
    colorClass = "bg-amber-50 text-amber-700 border-amber-100";
  }

  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-bold ${colorClass}`}>
      {esforco}/10
    </span>
  );
};

const renderDivertimento = (diversao: number | null | undefined) => {
  if (diversao === null || diversao === undefined) {
    return <span className="font-medium text-slate-400">-</span>;
  }
  const emojis = ["😴", "😕", "😊", "😄", "🤩"];
  const emoji = emojis[diversao - 1] ?? "❓";
  return (
    <span className="inline-flex items-center gap-1 text-sm font-semibold text-slate-700">
      <span className="text-base" title={`Nível ${diversao}/5`}>{emoji}</span>
      <span className="text-xs text-slate-500">({diversao})</span>
    </span>
  );
};

const formatFC = (fcMedia: number | null | undefined, fcMaxima: number | null | undefined) => {
  if (!fcMedia && !fcMaxima) return <span className="text-slate-400 font-medium">-</span>;
  const mediaStr = fcMedia ? `${fcMedia}` : "-";
  const maxStr = fcMaxima ? `${fcMaxima}` : "-";
  return (
    <span className="font-mono text-xs font-medium text-slate-700">
      {mediaStr}/{maxStr} <span className="text-[10px] text-slate-400">bpm</span>
    </span>
  );
};

const renderAlertas = (teveProblemas: boolean | null | undefined, hasSession: boolean) => {
  if (!hasSession) return <span className="text-slate-400 font-medium">-</span>;
  if (teveProblemas) {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full border border-rose-150 bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 animate-pulse"
        title="Reportou problemas durante o exercício"
      >
        <svg className="h-3 w-3 text-rose-500 fill-current" viewBox="0 0 16 16">
          <path d="M7.938 2.016A.13.13 0 0 1 8.002 2a.13.13 0 0 1 .063.016.146.146 0 0 1 .054.057l6.857 11.667c.036.06.035.124.002.183a.163.163 0 0 1-.054.06.116.116 0 0 1-.066.017H1.146a.115.115 0 0 1-.066-.017.163.163 0 0 1-.054-.06.176.176 0 0 1 .002-.183L7.884 2.073a.147.147 0 0 1 .054-.057zm1.044 8.089V6.262H7.018v3.843h1.964zm0 2.222v-1.111H7.018v1.111h1.964z"/>
        </svg>
        Aviso
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
      <svg className="h-3 w-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
      Sem problemas
    </span>
  );
};

const DashboardCorpoClinico = () => {
  const navigate = useNavigate();
  const { user } = useOutletContext<LayoutContext>();
  const displayName = user?.nome?.split(" ")[0] ?? "Colega";

  const [planos, setPlanos] = useState<PlanoPorPaciente[]>([]);
  const [ultimasSessoes, setUltimasSessoes] = useState<Record<string, UltimaSessao>>({});
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const carregar = async () => {
      try {
        setLoading(true);
        setErro(null);
        
        const lista = await planosService.getPlanosPorPacientes();
        setPlanos(lista);
        
        // Obter as sessões ordenadas por data descrescente
        const { data: sessoes, error: errSessao } = await supabase
          .from("sessoes_realizadas")
          .select("id_paciente, data_hora, esforco_1_a_10, diversao_1_a_5, fc_media, fc_maxima, teve_problemas")
          .order("data_hora", { ascending: false });
          
        if (errSessao) {
          console.error("Erro ao obter sessões:", errSessao);
        } else {
          const sessoesMapeadas: Record<string, UltimaSessao> = {};
          (sessoes ?? []).forEach((sessao) => {
            if (!sessoesMapeadas[sessao.id_paciente]) {
              sessoesMapeadas[sessao.id_paciente] = sessao as UltimaSessao;
            }
          });
          setUltimasSessoes(sessoesMapeadas);
        }
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
        <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-indigo-600 to-slate-900 p-6 text-white shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-200">
                Painel do Corpo Clínico
              </p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Olá, Dr. {displayName}
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-indigo-100 sm:text-base">
                Prescreva programas de exercício para crianças e jovens dos 6
                aos 18 anos, reveja protocolos e acompanhe o progresso diário.
              </p>
            </div>
            <div className="flex flex-col gap-3 rounded-3xl bg-white/10 px-4 py-4 text-right backdrop-blur-sm">
              <div>
                <p className="text-sm font-medium text-indigo-100">
                  Pacientes registados
                </p>
                <p className="mt-1 text-2xl font-bold">
                  {loading ? "…" : planos.length}
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

        {/* As tuas 3 métricas novas e limpas */}
        <section className="grid gap-4 lg:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
              Planos ativos
            </p>
            <p className="mt-4 text-3xl font-bold text-slate-900">
              {loading ? "…" : totalPlanosAtivos}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Programas de exercício em curso.
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
              Planos concluídos
            </p>
            <p className="mt-4 text-3xl font-bold text-slate-900">
              {loading ? "…" : totalPlanosInativos}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Histórico de planos finalizados ou cancelados.
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
              Sem plano ativo
            </p>
            <p className="mt-4 text-3xl font-bold text-slate-900">
              {loading ? "…" : pacientesSemPlano}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Pacientes que necessitam de prescrição.
            </p>
          </article>
        </section>

        {/* Tabela de pacientes e botões de ação que o Claude apagou */}
        <section className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Pacientes</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Clique numa linha para ver o detalhe do paciente.
                </p>
              </div>
              <BtnGlobal
                onClick={() => navigate("/dashboard/medico/adesao")}
                className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
              >
                Gerir planos
              </BtnGlobal>
            </div>

            {erro && (
              <div className="mt-4 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
                {erro}
              </div>
            )}

            <div className="mt-6 overflow-x-auto rounded-3xl border border-slate-200 bg-slate-50">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-white text-slate-600">
                  <tr>
                    <th className="px-4 py-4 font-semibold">Criança</th>
                    <th className="px-4 py-4 font-semibold text-center">Plano Ativo</th>
                    <th className="px-4 py-4 font-semibold text-center">Esforço (OMNI)</th>
                    <th className="px-4 py-4 font-semibold text-center">Divertimento</th>
                    <th className="px-4 py-4 font-semibold text-center">FC Média/Máx</th>
                    <th className="px-4 py-4 font-semibold text-center">Alertas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-8 text-center text-slate-500"
                      >
                        A carregar pacientes…
                      </td>
                    </tr>
                  ) : planos.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-8 text-center text-slate-500"
                      >
                        Nenhum paciente encontrado.
                      </td>
                    </tr>
                  ) : (
                    planos.map((paciente) => {
                      const temPlanoAtivo = paciente.planos.some((p) => p.ativo);
                      const ultimaSessao = ultimasSessoes[paciente.id_paciente];

                      return (
                        <tr
                          key={paciente.id_paciente}
                          onClick={() =>
                            navigate(
                              `/dashboard/medico/pacientes/${paciente.id_paciente}`,
                            )
                          }
                          className="cursor-pointer transition hover:bg-indigo-50/50"
                        >
                          <td className="px-4 py-4 font-semibold text-slate-900">
                            {paciente.nome}
                          </td>
                          <td className="px-4 py-4 text-center">
                            {temPlanoAtivo ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-100">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                                Sim
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 border border-slate-200">
                                <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
                                Não
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-center">
                            {renderEsforco(ultimaSessao?.esforco_1_a_10)}
                          </td>
                          <td className="px-4 py-4 text-center">
                            {renderDivertimento(ultimaSessao?.diversao_1_a_5)}
                          </td>
                          <td className="px-4 py-4 text-center">
                            {formatFC(ultimaSessao?.fc_media, ultimaSessao?.fc_maxima)}
                          </td>
                          <td className="px-4 py-4 text-center">
                            {renderAlertas(ultimaSessao?.teve_problemas, !!ultimaSessao)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Ações rápidas
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Atalhos para o dia a dia.
                </p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              <BtnGlobal
                onClick={() => navigate("/plano/criar")}
                className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Criar novo plano
              </BtnGlobal>
              <BtnGlobal
                onClick={() => navigate("/dashboard/medico/pacientes")}
                className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Gerir planos de pacientes
              </BtnGlobal>
              <BtnGlobal
                onClick={() => navigate("/exercicios")}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold !text-slate-700 hover:bg-slate-50"
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
