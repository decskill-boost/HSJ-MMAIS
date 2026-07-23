import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  planosService,
  type PlanoPorPaciente,
} from "../../services/planosService";
import BtnGlobal from "../BtnGlobal";
import { supabase } from "../../services/supabaseClient";
import LoadingSpinner from "../LoadingSpinner";

const formatarData = (data?: string | null) => {
  if (!data) return "-";
  return new Date(data).toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

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
    return <span className="font-medium text-aco">-</span>;
  }
  let colorClass = "bg-turbo/10 text-turbo-escuro border-turbo/30";
  if (esforco >= 8) {
    colorClass = "bg-capa/10 text-capa-escura border-capa/30";
  } else if (esforco >= 4) {
    colorClass = "bg-raio/20 text-tinta border-raio/50";
  }

  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-bold ${colorClass}`}>
      {esforco}/10
    </span>
  );
};

const renderDivertimento = (diversao: number | null | undefined) => {
  if (diversao === null || diversao === undefined) {
    return <span className="font-medium text-aco">-</span>;
  }
  const emojis = ["😴", "😕", "😊", "😄", "🤩"];
  const emoji = emojis[diversao - 1] ?? "❓";
  return (
    <span className="inline-flex items-center gap-1 text-sm font-semibold text-tinta">
      <span className="text-base" title={`Nível ${diversao}/5`}>{emoji}</span>
      <span className="text-xs text-aco">({diversao})</span>
    </span>
  );
};

const formatFC = (fcMedia: number | null | undefined, fcMaxima: number | null | undefined) => {
  if (!fcMedia && !fcMaxima) return <span className="text-aco font-medium">-</span>;
  const mediaStr = fcMedia ? `${fcMedia}` : "-";
  const maxStr = fcMaxima ? `${fcMaxima}` : "-";
  return (
    <span className="font-mono text-xs font-medium text-tinta">
      {mediaStr}/{maxStr} <span className="text-[10px] text-aco">bpm</span>
    </span>
  );
};

const renderAlertas = (teveProblemas: boolean | null | undefined, hasSession: boolean) => {
  if (!hasSession) return <span className="text-aco font-medium">-</span>;
  if (teveProblemas) {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full border border-capa/30 bg-capa/10 px-2.5 py-0.5 text-xs font-semibold text-capa-escura"
        title="Reportou problemas durante o exercício"
      >
        <svg className="h-3 w-3 text-capa fill-current" viewBox="0 0 16 16">
          <path d="M7.938 2.016A.13.13 0 0 1 8.002 2a.13.13 0 0 1 .063.016.146.146 0 0 1 .054.057l6.857 11.667c.036.06.035.124.002.183a.163.163 0 0 1-.054.06.116.116 0 0 1-.066.017H1.146a.115.115 0 0 1-.066-.017.163.163 0 0 1-.054-.06.176.176 0 0 1 .002-.183L7.884 2.073a.147.147 0 0 1 .054-.057zm1.044 8.089V6.262H7.018v3.843h1.964zm0 2.222v-1.111H7.018v1.111h1.964z"/>
        </svg>
        Aviso
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-turbo/30 bg-turbo/10 px-2.5 py-0.5 text-xs font-semibold text-turbo-escuro">
      <svg className="h-3 w-3 text-turbo-escuro" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
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
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const [sessoes, setSessoes] = useState<any[]>([]);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [paginaSessoes, setPaginaSessoes] = useState(1);
  const [sessaoDetalhada, setSessaoDetalhada] = useState<any | null>(null);
  
  const itensPorPagina = 5;
  const sessoesPorPagina = 5;

  const carregar = async () => {
    if (!pacienteId) return;

    try {
      setLoading(true);
      setErro(null);
      const dados = await planosService.getPlanosPorPaciente(pacienteId);
      setPaciente(dados);

      // Obter todas as sessões concluídas por este paciente, incluindo o nome do exercício
      const { data: sessoesDados, error: errSessao } = await supabase
        .from("sessoes_realizadas")
        .select(`
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
        `)
        .eq("id_paciente", pacienteId)
        .order("data_hora", { ascending: false });

      if (errSessao) {
        console.error("Erro ao obter histórico de sessões:", errSessao);
      } else {
        setSessoes(sessoesDados ?? []);
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
    setPaginaAtual(1);
    setPaginaSessoes(1);
    void carregar();
  }, [pacienteId]);

  const handleCancelarPlano = async (idPlano: string) => {
    if (!window.confirm("Deseja cancelar este plano?")) return;

    try {
      setCancellingId(idPlano);
      setSucesso(false);
      await planosService.cancelPlano(idPlano);
      setSucesso(true);
      await carregar();
    } catch (err) {
      setErro(
        err instanceof Error
          ? err.message
          : "Não foi possível cancelar o plano.",
      );
    } finally {
      setCancellingId(null);
    }
  };

  const planosAtivos = useMemo(
    () => paciente?.planos.filter((p) => p.ativo) ?? [],
    [paciente],
  );

  const totalPaginas = useMemo(
    () => Math.ceil((paciente?.planos.length ?? 0) / itensPorPagina),
    [paciente?.planos, itensPorPagina]
  );

  const planosPaginados = useMemo(() => {
    if (!paciente?.planos) return [];
    const inicio = (paginaAtual - 1) * itensPorPagina;
    return paciente.planos.slice(inicio, inicio + itensPorPagina);
  }, [paciente?.planos, paginaAtual, itensPorPagina]);

  const totalPaginasSessoes = useMemo(
    () => Math.ceil(sessoes.length / sessoesPorPagina),
    [sessoes, sessoesPorPagina]
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
        <div className="rounded-2xl bg-capa/10 p-4 text-capa-escura">{erro}</div>
      </div>
    );
  }

  if (!paciente) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="rounded-2xl bg-papel p-6 shadow-sm">
          <p className="text-tinta">Paciente não encontrado.</p>
          <button
            onClick={() => navigate("/dashboard/medico/pacientes")}
            className="mt-4 rounded-(--radius-vinheta) border-[3px] border-tinta bg-tinta px-4 py-2 text-sm font-semibold text-papel shadow-vinheta transition hover:bg-tinta/90 active:scale-95 active:shadow-none"
          >
            Voltar para lista
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-tinta">
            {paciente.nome}
          </h1>
          <p className="mt-1 text-sm text-aco">
            Detalhe de planos para este paciente.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <BtnGlobal
            onClick={() =>
              navigate(`/plano/criar?paciente=${paciente.id_paciente}`)
            }
            className="rounded-(--radius-vinheta) px-4 py-3 text-sm font-semibold"
          >
            Atribuir novo plano
          </BtnGlobal>
          <button
            onClick={() => navigate("/dashboard/medico/pacientes")}
            className="rounded-(--radius-vinheta) border-[3px] border-tinta bg-tinta px-4 py-3 text-sm font-semibold text-papel shadow-vinheta transition hover:bg-tinta/90 active:scale-95 active:shadow-none"
          >
            Voltar para lista
          </button>
        </div>
      </div>

      {sucesso && (
        <div className="mb-6 rounded-2xl bg-turbo/10 p-4 text-sm text-turbo-escuro">
          Plano cancelado com sucesso.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <article className="rounded-3xl border border-tinta/15 bg-papel-claro p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-aco">
            Planos ativos
          </p>
          <p className="mt-4 text-3xl font-bold text-tinta">
            {planosAtivos.length}
          </p>
          <p className="mt-2 text-sm text-aco">
            Planos com status ativo hoje.
          </p>
        </article>
        <article className="rounded-3xl border border-tinta/15 bg-papel-claro p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-aco">
            Planos totais
          </p>
          <p className="mt-4 text-3xl font-bold text-tinta">
            {paciente.planos.length}
          </p>
          <p className="mt-2 text-sm text-aco">
            Inclui ativos e inativos.
          </p>
        </article>
        <article className="rounded-3xl border border-tinta/15 bg-papel-claro p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-aco">
            Último início
          </p>
          <p className="mt-4 text-3xl font-bold text-tinta">
            {formatarData(paciente.planos[0]?.data_inicio)}
          </p>
          <p className="mt-2 text-sm text-aco">
            Data do plano mais recente.
          </p>
        </article>
      </div>

      {/* Histórico de Treinos / Sessões */}
      <div className="mt-8 rounded-3xl border border-tinta/15 bg-papel-claro shadow-sm overflow-hidden">
        <div className="p-6 border-b border-tinta/10">
          <h2 className="text-lg font-bold text-tinta">Histórico de Treinos / Sessões</h2>
          <p className="mt-1 text-sm text-aco">
            Lista de treinos e sessões de exercícios concluídas por esta criança.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className="bg-papel text-aco">
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
                    className="px-4 py-8 text-center text-sm text-aco"
                  >
                    Nenhum treino registado por esta criança.
                  </td>
                </tr>
              ) : (
                sessoesPaginadas.map((sessao: any) => {
                  const nomeExercicio = (sessao.exercicios as any)?.nome_exercicio ?? "Exercício Geral";
                  return (
                    <tr
                      key={sessao.id_sessao}
                      className="border-t border-tinta/15 last:border-b"
                    >
                      <td className="px-4 py-4 text-tinta font-medium">
                        {formatarDataHora(sessao.data_hora)}
                      </td>
                      <td className="px-4 py-4 text-tinta font-semibold">
                        {nomeExercicio}
                      </td>
                      <td className="px-4 py-4 text-tinta font-medium">
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
                          className="rounded-xl border border-cobalto/30 bg-cobalto/10 px-3 py-2 text-xs font-semibold text-cobalto transition hover:bg-cobalto/20"
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
          <div className="flex items-center justify-between border-t border-tinta/15 bg-papel-claro px-4 py-3 sm:px-6">
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                onClick={() => setPaginaSessoes((prev) => Math.max(prev - 1, 1))}
                disabled={paginaSessoes === 1}
                className="relative inline-flex items-center rounded-xl border border-tinta/20 bg-papel-claro px-4 py-2 text-xs font-semibold text-tinta hover:bg-papel disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <button
                onClick={() => setPaginaSessoes((prev) => Math.min(prev + 1, totalPaginasSessoes))}
                disabled={paginaSessoes === totalPaginasSessoes}
                className="relative ml-3 inline-flex items-center rounded-xl border border-tinta/20 bg-papel-claro px-4 py-2 text-xs font-semibold text-tinta hover:bg-papel disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Seguinte
              </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-xs text-aco">
                  A mostrar <span className="font-semibold">{((paginaSessoes - 1) * sessoesPorPagina) + 1}</span> a{" "}
                  <span className="font-semibold">
                    {Math.min(paginaSessoes * sessoesPorPagina, sessoes.length)}
                  </span>{" "}
                  de <span className="font-semibold">{sessoes.length}</span> treinos
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-xl shadow-sm" aria-label="Pagination">
                  <button
                    onClick={() => setPaginaSessoes((prev) => Math.max(prev - 1, 1))}
                    disabled={paginaSessoes === 1}
                    className="relative inline-flex items-center rounded-l-xl px-2.5 py-2 text-aco ring-1 ring-inset ring-tinta/15 hover:bg-papel focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Anterior</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  {Array.from({ length: totalPaginasSessoes }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPaginaSessoes(p)}
                      aria-current={p === paginaSessoes ? "page" : undefined}
                      className={`relative inline-flex items-center px-3 py-1.5 text-xs font-semibold focus:z-20 ${
                        p === paginaSessoes
                          ? "z-10 bg-cobalto text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalto"
                          : "text-tinta ring-1 ring-inset ring-tinta/15 hover:bg-papel focus:outline-offset-0"
                      }`}
                    >
                      {p}
                    </button>
                  ))}

                  <button
                    onClick={() => setPaginaSessoes((prev) => Math.min(prev + 1, totalPaginasSessoes))}
                    disabled={paginaSessoes === totalPaginasSessoes}
                    className="relative inline-flex items-center rounded-r-xl px-2 py-2 text-aco ring-1 ring-inset ring-tinta/15 hover:bg-papel focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Seguinte</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabela de Planos Atribuídos */}
      <div className="mt-8 rounded-3xl border border-tinta/15 bg-papel-claro shadow-sm overflow-hidden">
        <div className="p-6 border-b border-tinta/10">
          <h2 className="text-lg font-bold text-tinta">Planos Prescritos</h2>
          <p className="mt-1 text-sm text-aco">
            Lista de planos de exercícios prescritos a este paciente.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className="bg-papel text-aco">
              <tr>
                <th className="px-4 py-4 font-semibold">Plano</th>
                <th className="px-4 py-4 font-semibold">Início</th>
                <th className="px-4 py-4 font-semibold">Validade</th>
                <th className="px-4 py-4 font-semibold">Status</th>
                <th className="px-4 py-4 font-semibold">Notas</th>
                <th className="px-4 py-4 font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {paciente.planos.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-sm text-aco"
                  >
                    Nenhum plano atribuído a este paciente.
                  </td>
                </tr>
              ) : (
                planosPaginados.map((plano) => (
                  <tr
                    key={plano.id_plano}
                    className="border-t border-tinta/15 last:border-b"
                  >
                    <td className="px-4 py-4 font-semibold text-tinta">
                      {plano.frequencia_semanal}x/semana
                    </td>
                    <td className="px-4 py-4 text-tinta font-medium">
                      {formatarData(plano.data_inicio)}
                    </td>
                    <td className="px-4 py-4 text-tinta font-medium">
                      {formatarData(plano.data_validade)}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${plano.ativo ? "bg-turbo/15 text-turbo-escuro" : "bg-papel text-aco"}`}
                      >
                        {plano.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-aco">
                      {plano.notas_medicas ?? "Sem notas médicas."}
                    </td>
                    <td className="px-4 py-4">
                      {plano.ativo ? (
                        <button
                          type="button"
                          onClick={() => handleCancelarPlano(plano.id_plano)}
                          disabled={cancellingId === plano.id_plano}
                          className="rounded-xl border border-capa/30 bg-capa/10 px-3 py-2 text-xs font-semibold text-capa-escura transition hover:bg-capa/20 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {cancellingId === plano.id_plano
                            ? "A cancelar…"
                            : "Cancelar"}
                        </button>
                      ) : (
                        <span className="text-xs italic text-aco">
                          Sem ações
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPaginas > 1 && (
          <div className="flex items-center justify-between border-t border-tinta/15 bg-papel-claro px-4 py-3 sm:px-6">
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                onClick={() => setPaginaAtual((prev) => Math.max(prev - 1, 1))}
                disabled={paginaAtual === 1}
                className="relative inline-flex items-center rounded-xl border border-tinta/20 bg-papel-claro px-4 py-2 text-xs font-semibold text-tinta hover:bg-papel disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <button
                onClick={() => setPaginaAtual((prev) => Math.min(prev + 1, totalPaginas))}
                disabled={paginaAtual === totalPaginas}
                className="relative ml-3 inline-flex items-center rounded-xl border border-tinta/20 bg-papel-claro px-4 py-2 text-xs font-semibold text-tinta hover:bg-papel disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Seguinte
              </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-xs text-aco">
                  A mostrar <span className="font-semibold">{((paginaAtual - 1) * itensPorPagina) + 1}</span> a{" "}
                  <span className="font-semibold">
                    {Math.min(paginaAtual * itensPorPagina, paciente.planos.length)}
                  </span>{" "}
                  de <span className="font-semibold">{paciente.planos.length}</span> planos
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-xl shadow-sm" aria-label="Pagination">
                  <button
                    onClick={() => setPaginaAtual((prev) => Math.max(prev - 1, 1))}
                    disabled={paginaAtual === 1}
                    className="relative inline-flex items-center rounded-l-xl px-2.5 py-2 text-aco ring-1 ring-inset ring-tinta/15 hover:bg-papel focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Anterior</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPaginaAtual(p)}
                      aria-current={p === paginaAtual ? "page" : undefined}
                      className={`relative inline-flex items-center px-3 py-1.5 text-xs font-semibold focus:z-20 ${
                        p === paginaAtual
                          ? "z-10 bg-cobalto text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalto"
                          : "text-tinta ring-1 ring-inset ring-tinta/15 hover:bg-papel focus:outline-offset-0"
                      }`}
                    >
                      {p}
                    </button>
                  ))}

                  <button
                    onClick={() => setPaginaAtual((prev) => Math.min(prev + 1, totalPaginas))}
                    disabled={paginaAtual === totalPaginas}
                    className="relative inline-flex items-center rounded-r-xl px-2 py-2 text-aco ring-1 ring-inset ring-tinta/15 hover:bg-papel focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Seguinte</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-tinta/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg rounded-3xl border border-tinta/15 bg-papel-claro p-6 shadow-xl entrada-pop">
            <button
              onClick={() => setSessaoDetalhada(null)}
              className="absolute right-4 top-4 rounded-xl p-1.5 text-aco hover:bg-papel hover:text-aco"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-xl font-bold text-tinta">Métricas Detalhadas do Treino</h3>
            <p className="mt-1 text-sm text-aco">
              Registos clínicos recolhidos nesta sessão de exercício.
            </p>

            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-papel p-4 border border-tinta/10">
                  <p className="text-xs font-bold uppercase tracking-wider text-aco">Exercício</p>
                  <p className="mt-1 text-sm font-bold text-tinta">
                    {(sessaoDetalhada.exercicios as any)?.nome_exercicio ?? "Exercício Geral"}
                  </p>
                </div>
                <div className="rounded-2xl bg-papel p-4 border border-tinta/10">
                  <p className="text-xs font-bold uppercase tracking-wider text-aco">Duração</p>
                  <p className="mt-1 text-sm font-semibold text-tinta">
                    {formatarDuracaoSessao(sessaoDetalhada.duracao)}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-papel p-4 border border-tinta/10">
                <p className="text-xs font-bold uppercase tracking-wider text-aco">Data e Hora de Conclusão</p>
                <p className="mt-1 text-sm font-semibold text-tinta">
                  {formatarDataHora(sessaoDetalhada.data_hora)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-papel p-4 border border-tinta/10">
                  <p className="text-xs font-bold uppercase tracking-wider text-aco text-center">Esforço (OMNI)</p>
                  <div className="mt-2 flex justify-center">
                    {renderEsforco(sessaoDetalhada.esforco_1_a_10)}
                  </div>
                </div>
                <div className="rounded-2xl bg-papel p-4 border border-tinta/10">
                  <p className="text-xs font-bold uppercase tracking-wider text-aco text-center">Divertimento</p>
                  <div className="mt-2 flex justify-center">
                    {renderDivertimento(sessaoDetalhada.diversao_1_a_5)}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-papel p-4 border border-tinta/10">
                <p className="text-xs font-bold uppercase tracking-wider text-aco">Frequência Cardíaca (Média / Máxima)</p>
                <div className="mt-2 flex items-center justify-center">
                  {formatFC(sessaoDetalhada.fc_media, sessaoDetalhada.fc_maxima)}
                </div>
              </div>

              <div className="rounded-2xl bg-papel p-4 border border-tinta/10">
                <p className="text-xs font-bold uppercase tracking-wider text-aco mb-1">Intercorrências / Alertas</p>
                <div>
                  {renderAlertas(sessaoDetalhada.teve_problemas, true)}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSessaoDetalhada(null)}
                className="rounded-(--radius-vinheta) border-[3px] border-tinta bg-tinta px-4 py-2.5 text-sm font-semibold text-papel shadow-vinheta transition hover:bg-tinta/90 active:scale-95 active:shadow-none"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PacienteDetalhe;
