import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  planosService,
  type PlanoPorPaciente,
} from "../../services/planosService";
import BtnGlobal from "../BtnGlobal";
import { supabase } from "../../services/supabaseClient";
import LoadingSpinner from "../LoadingSpinner";
import {
  pacientesService,
  type PacienteDetalhe as PacienteInfo,
} from "../../services/pacientes";

interface SessaoRealizadaInfo {
  id_sessao: string;
  data_hora: string;
  esforco_1_a_10: number | null;
  diversao_1_a_5: number | null;
  fc_media: number | null;
  fc_maxima: number | null;
  teve_problemas: boolean | null;
  duracao: number | null;
  exercicios: {
    nome_exercicio: string;
  } | null;
}

const RECOMPENSAS = [
  {
    id: "diploma",
    nome: "Diploma de Iniciante",
    xpNecessario: 100,
    icone: "🎓",
    desc: "Atingir 100 XP (Nível 2)",
  },
  {
    id: "super_atleta",
    nome: "Super Atleta",
    xpNecessario: 300,
    icone: "⚡",
    desc: "Atingir 300 XP (Nível 3)",
  },
  {
    id: "campeao_mmais",
    nome: "Campeão MMAIS",
    xpNecessario: 600,
    icone: "🛡️",
    desc: "Atingir 600 XP (Nível 4)",
  },
  {
    id: "lenda_hospital",
    nome: "Lenda do Hospital",
    xpNecessario: 1000,
    icone: "🏆",
    desc: "Atingir 1000 XP (Nível 5)",
  },
];

const formatarDataHora = (data?: string | null) => {
  if (!data) return "-";
  return new Date(data).toLocaleString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatarDuracaoSessao = (segundos?: number | null) => {
  if (segundos === null || segundos === undefined) return "-";
  if (segundos < 60) return `${segundos} seg`;
  return `${Math.round(segundos / 60)} min`;
};

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
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-bold ${colorClass}`}
    >
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
      <span className="text-base" title={`Nível ${diversao}/5`}>
        {emoji}
      </span>
      <span className="text-xs text-slate-500">({diversao})</span>
    </span>
  );
};

const formatFC = (
  fcMedia: number | null | undefined,
  fcMaxima: number | null | undefined,
) => {
  if (!fcMedia && !fcMaxima)
    return <span className="text-slate-400 font-medium">-</span>;
  const mediaStr = fcMedia ? `${fcMedia}` : "-";
  const maxStr = fcMaxima ? `${fcMaxima}` : "-";
  return (
    <span className="font-mono text-xs font-medium text-slate-700">
      {mediaStr}/{maxStr}{" "}
      <span className="text-[10px] text-slate-400">bpm</span>
    </span>
  );
};

const renderAlertas = (
  teveProblemas: boolean | null | undefined,
  hasSession: boolean,
) => {
  if (!hasSession) return <span className="text-slate-400 font-medium">-</span>;
  if (teveProblemas) {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full border border-rose-150 bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700"
        title="Reportou problemas durante o exercício"
      >
        <svg className="h-3 w-3 text-rose-500 fill-current" viewBox="0 0 16 16">
          <path d="M7.938 2.016A.13.13 0 0 1 8.002 2a.13.13 0 0 1 .063.016.146.146 0 0 1 .054.057l6.857 11.667c.036.06.035.124.002.183a.163.163 0 0 1-.054.06.116.116 0 0 1-.066.017H1.146a.115.115 0 0 1-.066-.017.163.163 0 0 1-.054-.06.176.176 0 0 1 .002-.183L7.884 2.073a.147.147 0 0 1 .054-.057zm1.044 8.089V6.262H7.018v3.843h1.964zm0 2.222v-1.111H7.018v1.111h1.964z" />
        </svg>
        Aviso
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
      <svg
        className="h-3 w-3 text-emerald-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="3"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
      Sem problemas
    </span>
  );
};

const PacienteDetalhe = () => {
  const { pacienteId } = useParams<{ pacienteId: string }>();
  const navigate = useNavigate();
  const [paciente, setPaciente] = useState<PlanoPorPaciente | null>(null);
  const [pacienteInfo, setPacienteInfo] = useState<PacienteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [sessoes, setSessoes] = useState<SessaoRealizadaInfo[]>([]);
  const [paginaSessoes, setPaginaSessoes] = useState(1);
  const [sessaoDetalhada, setSessaoDetalhada] = useState<SessaoRealizadaInfo | null>(null);

  const sessoesPorPagina = 5;

  const carregar = async () => {
    if (!pacienteId) return;

    try {
      setLoading(true);
      setErro(null);

      const [dados, info] = await Promise.all([
        planosService.getPlanosPorPaciente(pacienteId),
        pacientesService.getPacienteById(pacienteId),
      ]);

      setPaciente(dados);
      setPacienteInfo(info);

      // Obter todas as sessões concluídas por este paciente, incluindo o nome do exercício
      const { data: sessoesDados, error: errSessao } = await supabase
        .from("sessoes_realizadas")
        .select(
          `
          id_sessao, 
          data_hora, 
          esforco_1_a_10, 
          diversao_1_a_5, 
          fc_media, 
          fc_maxima, 
          teve_problemas, 
          duracao,
          exercicios (
            nome_exercicio
          )
        `,
        )
        .eq("id_paciente", pacienteId)
        .order("data_hora", { ascending: false });

      if (errSessao) {
        console.error("Erro ao obter histórico de sessões:", errSessao);
      } else {
        setSessoes((sessoesDados as unknown as SessaoRealizadaInfo[]) ?? []);
      }
    } catch (err) {
      setErro(
        err instanceof Error ? err.message : "Erro ao carregar o paciente.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPaginaSessoes(1);
    void carregar();
  }, [pacienteId]);

  const totalTreinos = sessoes.length;

  const esforcoMedio = useMemo(() => {
    const comEsforco = sessoes.filter(
      (s) => s.esforco_1_a_10 !== null && s.esforco_1_a_10 !== undefined,
    );
    if (comEsforco.length === 0) return "-";
    const soma = comEsforco.reduce((acc, s) => acc + s.esforco_1_a_10!, 0);
    return (soma / comEsforco.length).toFixed(1) + "/10";
  }, [sessoes]);

  const fcMediaGlobal = useMemo(() => {
    const comFc = sessoes.filter(
      (s) => s.fc_media !== null && s.fc_media !== undefined && s.fc_media > 0,
    );
    if (comFc.length === 0) return "-";
    const soma = comFc.reduce((acc, s) => acc + s.fc_media!, 0);
    return Math.round(soma / comFc.length) + " bpm";
  }, [sessoes]);

  const totalPaginasSessoes = useMemo(
    () => Math.ceil(sessoes.length / sessoesPorPagina),
    [sessoes, sessoesPorPagina],
  );

  const sessoesPaginadas = useMemo(() => {
    const inicio = (paginaSessoes - 1) * sessoesPorPagina;
    return sessoes.slice(inicio, inicio + sessoesPorPagina);
  }, [sessoes, paginaSessoes, sessoesPorPagina]);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <LoadingSpinner mensagem="A carregar detalhes do paciente..." />
      </div>
    );
  }

  if (erro) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="rounded-2xl bg-red-50 p-4 text-red-700">{erro}</div>
      </div>
    );
  }

  if (!paciente) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="rounded-2xl bg-slate-50 p-6 shadow-sm">
          <p className="text-slate-700">Paciente não encontrado.</p>
          <BtnGlobal
            onClick={() => navigate("/dashboard/medico/pacientes")}
            className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Voltar para lista
          </BtnGlobal>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            {paciente.nome}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Acompanhamento e histórico de treinos deste paciente.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <BtnGlobal
            onClick={() => navigate("/dashboard/medico/pacientes")}
            className="rounded-xl bg-slate-900 px-4 py-3 text-sm text-white hover:bg-slate-800"
          >
            Voltar para lista
          </BtnGlobal>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
            Treinos Concluídos
          </p>
          <p className="mt-4 text-3xl font-bold text-slate-900">
            {totalTreinos}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Total de sessões realizadas por esta criança.
          </p>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
            Esforço Médio
          </p>
          <p className="mt-4 text-3xl font-bold text-slate-900">
            {esforcoMedio}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Perceção de esforço média relatada.
          </p>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
            Frequência Cardíaca Média
          </p>
          <p className="mt-4 text-3xl font-bold text-slate-900">
            {fcMediaGlobal}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Frequência cardíaca média global.
          </p>
        </article>
      </div>

      {/* Histórico de Treinos / Sessões */}
      <div className="mt-8 rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">
            Histórico de Treinos / Sessões
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Lista de treinos e sessões de exercícios concluídas por esta
            criança.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-4 font-semibold">Data e Hora</th>
                <th className="px-4 py-4 font-semibold">Exercício</th>
                <th className="px-4 py-4 font-semibold">Duração</th>
                <th className="px-4 py-4 font-semibold text-center">Esforço</th>
                <th className="px-4 py-4 text-center font-semibold">Alertas</th>
                <th className="px-4 py-4 text-right font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {sessoes.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-sm text-slate-500"
                  >
                    Nenhum treino registado por esta criança.
                  </td>
                </tr>
              ) : (
                sessoesPaginadas.map((sessao: SessaoRealizadaInfo) => {
                  const nomeExercicio =
                    sessao.exercicios?.nome_exercicio ??
                    "Exercício Geral";
                  return (
                    <tr
                      key={sessao.id_sessao}
                      className="border-t border-slate-200 last:border-b"
                    >
                      <td className="px-4 py-4 text-slate-700 font-medium">
                        {formatarDataHora(sessao.data_hora)}
                      </td>
                      <td className="px-4 py-4 text-slate-900 font-semibold">
                        {nomeExercicio}
                      </td>
                      <td className="px-4 py-4 text-slate-700 font-medium">
                        {formatarDuracaoSessao(sessao.duracao)}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {renderEsforco(sessao.esforco_1_a_10)}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {renderAlertas(sessao.teve_problemas, true)}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button
                          onClick={() => setSessaoDetalhada(sessao)}
                          className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
                        >
                          Ver Métricas
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPaginasSessoes > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3 sm:px-6">
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                onClick={() =>
                  setPaginaSessoes((prev) => Math.max(prev - 1, 1))
                }
                disabled={paginaSessoes === 1}
                className="relative inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <button
                onClick={() =>
                  setPaginaSessoes((prev) =>
                    Math.min(prev + 1, totalPaginasSessoes),
                  )
                }
                disabled={paginaSessoes === totalPaginasSessoes}
                className="relative ml-3 inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Seguinte
              </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-xs text-slate-600">
                  A mostrar{" "}
                  <span className="font-semibold">
                    {(paginaSessoes - 1) * sessoesPorPagina + 1}
                  </span>{" "}
                  a{" "}
                  <span className="font-semibold">
                    {Math.min(paginaSessoes * sessoesPorPagina, sessoes.length)}
                  </span>{" "}
                  de <span className="font-semibold">{sessoes.length}</span>{" "}
                  treinos
                </p>
              </div>
              <div>
                <nav
                  className="isolate inline-flex -space-x-px rounded-xl shadow-sm"
                  aria-label="Pagination"
                >
                  <button
                    onClick={() =>
                      setPaginaSessoes((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={paginaSessoes === 1}
                    className="relative inline-flex items-center rounded-l-xl px-2.5 py-2 text-slate-400 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Anterior</span>
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>

                  {Array.from(
                    { length: totalPaginasSessoes },
                    (_, i) => i + 1,
                  ).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPaginaSessoes(p)}
                      aria-current={p === paginaSessoes ? "page" : undefined}
                      className={`relative inline-flex items-center px-3 py-1.5 text-xs font-semibold focus:z-20 ${
                        p === paginaSessoes
                          ? "z-10 bg-indigo-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                          : "text-slate-900 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 focus:outline-offset-0"
                      }`}
                    >
                      {p}
                    </button>
                  ))}

                  <button
                    onClick={() =>
                      setPaginaSessoes((prev) =>
                        Math.min(prev + 1, totalPaginasSessoes),
                      )
                    }
                    disabled={paginaSessoes === totalPaginasSessoes}
                    className="relative inline-flex items-center rounded-r-xl px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Seguinte</span>
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Métricas do Treino */}
      {sessaoDetalhada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-xl animate-fade-in">
            <button
              onClick={() => setSessaoDetalhada(null)}
              className="absolute right-4 top-4 rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <h3 className="text-xl font-bold text-slate-900">
              Métricas Detalhadas do Treino
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Registos clínicos recolhidos nesta sessão de exercício.
            </p>

            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Exercício
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-800">
                    {sessaoDetalhada.exercicios?.nome_exercicio ??
                      "Exercício Geral"}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Duração
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {formatarDuracaoSessao(sessaoDetalhada.duracao)}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Data e Hora de Conclusão
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {formatarDataHora(sessaoDetalhada.data_hora)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 text-center">
                    Esforço (OMNI)
                  </p>
                  <div className="mt-2 flex justify-center">
                    {renderEsforco(sessaoDetalhada.esforco_1_a_10)}
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 text-center">
                    Divertimento
                  </p>
                  <div className="mt-2 flex justify-center">
                    {renderDivertimento(sessaoDetalhada.diversao_1_a_5)}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Frequência Cardíaca (Média / Máxima)
                </p>
                <div className="mt-2 flex items-center justify-center">
                  {formatFC(
                    sessaoDetalhada.fc_media,
                    sessaoDetalhada.fc_maxima,
                  )}
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Intercorrências / Alertas
                </p>
                <div>{renderAlertas(sessaoDetalhada.teve_problemas, true)}</div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <BtnGlobal
                onClick={() => setSessaoDetalhada(null)}
                className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Fechar
              </BtnGlobal>
            </div>
          </div>
        </div>
      )}
      {pacienteInfo && (
        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">
            Recompensas e Conquistas
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Progresso de prémios da criança com base no XP acumulado (
            {pacienteInfo.xp} XP total - Nível {pacienteInfo.nivel}).
          </p>
          <div className="mt-4 grid gap-4 grid-cols-2 sm:grid-cols-4">
            {RECOMPENSAS.map((rec) => {
              const desbloqueada = (pacienteInfo.xp ?? 0) >= rec.xpNecessario;
              return (
                <div
                  key={rec.id}
                  className={`rounded-2xl border p-4 text-center transition ${desbloqueada ? "border-emerald-200 bg-emerald-50/50" : "border-slate-100 bg-slate-50/50 opacity-60"}`}
                >
                  <span className="text-3xl block mb-2">{rec.icone}</span>
                  <p className="font-bold text-xs sm:text-sm text-slate-900 leading-tight">
                    {rec.nome}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">{rec.desc}</p>
                  <span
                    className={`inline-block mt-3 rounded-full px-2 py-0.5 text-[9px] font-bold ${desbloqueada ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}
                  >
                    {desbloqueada ? "Desbloqueado ✓" : "Bloqueado 🔒"}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};

export default PacienteDetalhe;
