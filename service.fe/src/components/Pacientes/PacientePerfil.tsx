import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  pacientesService,
  type HistoricoResposta,
  type PacienteDetalhe,
} from "../../services/pacientes";
import HistoricoCalendario from "./HistoricoCalendario";

const RECOMPENSAS = [
  { id: "diploma", nome: "Diploma de Iniciante", xpNecessario: 100, icone: "🎓", desc: "Atingir 100 XP (Nível 2)" },
  { id: "super_atleta", nome: "Super Atleta", xpNecessario: 300, icone: "⚡", desc: "Atingir 300 XP (Nível 3)" },
  { id: "campeao_mmais", nome: "Campeão MMAIS", xpNecessario: 600, icone: "🛡️", desc: "Atingir 600 XP (Nível 4)" },
  { id: "lenda_hospital", nome: "Lenda do Hospital", xpNecessario: 1000, icone: "🏆", desc: "Atingir 1000 XP (Nível 5)" },
];

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
      <span className="text-xs text-slate-500">({diversao}/5)</span>
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

const renderAlertas = (teveProblemas: boolean | null | undefined) => {
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

const PacientePerfil = () => {
  const { idPaciente } = useParams<{ idPaciente: string }>();
  const [paciente, setPaciente] = useState<PacienteDetalhe | null>(null);
  const [historico, setHistorico] = useState<HistoricoResposta | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!idPaciente) return;
    Promise.all([
      pacientesService.getPacienteById(idPaciente),
      pacientesService.getHistorico(idPaciente),
    ])
      .then(([dadosPaciente, dadosHistorico]) => {
        setPaciente(dadosPaciente);
        setHistorico(dadosHistorico);
      })
      .catch((err) => setErro(err.message))
      .finally(() => setLoading(false));
  }, [idPaciente]);

  const sessoesRecentes = useMemo(() => {
    if (!historico?.dias) return [];

    const lista: { data: string; sessao: any }[] = [];
    historico.dias.forEach((dia) => {
      dia.sessoes.forEach((sessao) => {
        lista.push({ data: dia.data, sessao });
      });
    });

    // Ordenar por data e hora decrescentes
    return lista
      .sort((a, b) => {
        const timeA = new Date(`${a.data}T${a.sessao.hora || "00:00:00"}`).getTime();
        const timeB = new Date(`${b.data}T${b.sessao.hora || "00:00:00"}`).getTime();
        return timeB - timeA;
      })
      .slice(0, 5);
  }, [historico]);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-10">
        <p className="text-sm text-slate-500">A carregar perfil do paciente...</p>
      </div>
    );
  }

  if (erro || !paciente) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-10">
        <p className="text-sm text-red-600">{erro ?? "Paciente não encontrado."}</p>
        <Link
          to="/dashboard/medico/adesao"
          className="mt-4 inline-block text-sm text-blue-600 hover:underline"
        >
          ← Voltar à lista de pacientes
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <Link
        to="/dashboard/medico/adesao"
        className="text-sm font-medium text-slate-500 transition hover:text-slate-900"
      >
        ← Voltar à lista de pacientes
      </Link>

      <section className="mt-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              {paciente.nome}
            </h1>
            <p className="mt-1 text-sm text-slate-500">{paciente.email}</p>
          </div>
          <div className="flex gap-6 text-center">
            <div>
              <p className="text-2xl font-bold text-slate-900">{paciente.nivel}</p>
              <p className="text-xs uppercase tracking-wide text-slate-400">Nível</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{paciente.xp}</p>
              <p className="text-xs uppercase tracking-wide text-slate-400">XP</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{paciente.streak_atual}</p>
              <p className="text-xs uppercase tracking-wide text-slate-400">Sequência</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Recompensas e Conquistas</h2>
        <p className="mt-1 text-sm text-slate-500">
          Progresso de prémios da criança com base no XP acumulado ({paciente.xp} XP total).
        </p>
        <div className="mt-4 grid gap-4 grid-cols-2 sm:grid-cols-4">
          {RECOMPENSAS.map((rec) => {
            const desbloqueada = paciente.xp >= rec.xpNecessario;
            return (
              <div
                key={rec.id}
                className={`rounded-2xl border p-4 text-center transition ${desbloqueada ? "border-emerald-200 bg-emerald-50/50" : "border-slate-100 bg-slate-50/50 opacity-60"}`}
              >
                <span className="text-3xl block mb-2">{rec.icone}</span>
                <p className="font-bold text-xs sm:text-sm text-slate-900 leading-tight">{rec.nome}</p>
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

      <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Sessões Recentes</h2>
        <p className="mt-1 text-sm text-slate-500">
          Últimas sessões de exercício realizadas pelo paciente (até 5 mais recentes).
        </p>
        {sessoesRecentes.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500 italic">Sem sessões registadas recentemente.</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-white text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Exercício</th>
                  <th className="px-4 py-3 font-semibold">Data e Hora</th>
                  <th className="px-4 py-3 font-semibold text-center">Estado</th>
                  <th className="px-4 py-3 font-semibold text-center">Esforço (OMNI)</th>
                  <th className="px-4 py-3 font-semibold text-center">Divertimento</th>
                  <th className="px-4 py-3 font-semibold text-center">FC Média/Máx</th>
                  <th className="px-4 py-3 font-semibold text-center">Alertas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {sessoesRecentes.map(({ data, sessao }) => {
                  const dataParts = data.split("-");
                  const dataExibicao = `${dataParts[2]}/${dataParts[1]}/${dataParts[0]}`;

                  return (
                    <tr key={sessao.idSessao} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3.5 font-bold text-slate-800">
                        {sessao.nomeExercicio}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">
                        {dataExibicao} às {sessao.hora || "00:00"}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                          sessao.status === "concluido"
                            ? "bg-emerald-100 text-emerald-800"
                            : sessao.status === "falhado"
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-800"
                        }`}>
                          {sessao.status === "concluido" ? "Concluído" : sessao.status === "falhado" ? "Falhado" : "Iniciado"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {renderEsforco(sessao.esforco)}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {renderDivertimento(sessao.diversao)}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {formatFC(sessao.fcMedia, sessao.fcMaxima)}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {renderAlertas(sessao.teveProblemas)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Histórico de assiduidade</h2>
        <p className="mt-1 text-sm text-slate-500">
          Dias em que os exercícios foram concluídos, falhados ou ignorados.
        </p>
        {historico && <HistoricoCalendario historico={historico} />}
      </section>
    </div>
  );
};

export default PacientePerfil;
