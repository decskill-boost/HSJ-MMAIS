import { useState } from "react";
import type { DiaHistorico, DiaStatus, HistoricoResposta, SessaoStatus } from "../../services/pacientes";

interface Props {
  historico: HistoricoResposta;
}

const STATUS_STYLES: Record<DiaStatus, string> = {
  concluido: "bg-emerald-500 text-white",
  falhado: "bg-red-500 text-white",
  ignorado: "bg-slate-300 text-slate-600",
  pendente: "border border-amber-300 bg-amber-100 text-amber-700",
  sem_plano: "text-slate-300",
};

const STATUS_LABELS: Record<DiaStatus, string> = {
  concluido: "Concluído",
  falhado: "Falhado",
  ignorado: "Ignorado",
  pendente: "Pendente",
  sem_plano: "Sem plano",
};

const SESSAO_STATUS_LABELS: Record<SessaoStatus, string> = {
  iniciado: "Iniciado (não concluído)",
  concluido: "Concluído",
  falhado: "Falhado",
};

const DIAS_SEMANA = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function indiceDiaSemanaSegundaFeiraPrimeiro(dataISO: string): number {
  const [y, m, d] = dataISO.split("-").map(Number);
  const dia = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return dia === 0 ? 6 : dia - 1;
}

const HistoricoCalendario = ({ historico }: Props) => {
  const [diaSelecionado, setDiaSelecionado] = useState<DiaHistorico | null>(null);

  const offsetPrimeiraSemana =
    historico.dias.length > 0
      ? indiceDiaSemanaSegundaFeiraPrimeiro(historico.dias[0].data)
      : 0;

  return (
    <div className="mt-4">
      <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-slate-400">
        {DIAS_SEMANA.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-2">
        {Array.from({ length: offsetPrimeiraSemana }).map((_, i) => (
          <div key={`vazio-${i}`} />
        ))}
        {historico.dias.map((dia) => (
          <button
            key={dia.data}
            type="button"
            onClick={() => setDiaSelecionado(dia)}
            title={`${dia.data} — ${STATUS_LABELS[dia.status]}`}
            className={`flex h-10 items-center justify-center rounded-lg text-xs font-semibold transition hover:opacity-80 ${STATUS_STYLES[dia.status]}`}
          >
            {Number(dia.data.slice(-2))}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
        {(Object.keys(STATUS_LABELS) as DiaStatus[]).map((status) => (
          <span key={status} className="flex items-center gap-1.5">
            <span
              className={`h-3 w-3 rounded ${STATUS_STYLES[status]} ${
                status === "sem_plano" ? "border border-slate-200" : ""
              }`}
            />
            {STATUS_LABELS[status]}
          </span>
        ))}
      </div>

      {historico.resumoSemanal.length > 0 && (
        <div className="mt-4 space-y-1 text-xs text-slate-500">
          {historico.resumoSemanal.map((semana) => (
            <p key={semana.semanaInicio}>
              Semana de {semana.semanaInicio}: {semana.diasConcluidos}
              {semana.frequenciaEsperada > 0 ? ` / ${semana.frequenciaEsperada}` : ""} dias
              concluídos
            </p>
          ))}
        </div>
      )}

      {diaSelecionado && (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">{diaSelecionado.data}</p>
            <button
              type="button"
              onClick={() => setDiaSelecionado(null)}
              className="text-xs font-medium text-slate-400 hover:text-slate-600"
            >
              Fechar
            </button>
          </div>
          {diaSelecionado.sessoes.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">Sem exercícios registados neste dia.</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {diaSelecionado.sessoes.map((sessao) => {
                const duracaoMinutos = sessao.duracaoSegundos ? Math.round(sessao.duracaoSegundos / 60) : "-";
                const esforcoTexto = sessao.esforco != null ? `${sessao.esforco}/10` : "-";
                const diversaoEmojis = ["😴", "😕", "😊", "😄", "🤩"];
                const diversaoEmoji = sessao.diversao != null ? diversaoEmojis[sessao.diversao - 1] ?? "❓" : null;

                return (
                  <li key={sessao.idSessao} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <h4 className="font-bold text-slate-800 text-sm">{sessao.nomeExercicio}</h4>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${sessao.status === "concluido" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                        {SESSAO_STATUS_LABELS[sessao.status]}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="text-slate-400 font-medium">⏱️ DURAÇÃO DA SESSÃO</p>
                        <p className="font-bold text-slate-800 mt-0.5">{duracaoMinutos} min</p>
                      </div>

                      <div>
                        <p className="text-slate-400 font-medium">💪 ESFORÇO (RPE OMNI)</p>
                        <p className="font-bold text-slate-800 mt-0.5">{esforcoTexto}</p>
                      </div>

                      <div>
                        <p className="text-slate-400 font-medium">😊 DIVERSÃO / MOTIVAÇÃO</p>
                        <p className="font-bold text-slate-800 mt-0.5">{diversaoEmoji ? `${diversaoEmoji} (${sessao.diversao}/5)` : "-"}</p>
                      </div>

                      <div>
                        <p className="text-slate-400 font-medium">⚠️ PROBLEMAS DURANTE O TREINO</p>
                        <p className="font-bold mt-0.5 text-slate-800">
                          {sessao.teveProblemas ? <span className="text-red-600">Sim ⚠️</span> : <span className="text-slate-500">Não ✓</span>}
                        </p>
                      </div>

                      <div>
                        <p className="text-slate-400 font-medium">👥 ENVOLVIMENTO FAMILIAR</p>
                        <p className="font-bold mt-0.5 text-slate-800">
                          {sessao.participacaoFamiliares ? <span className="text-emerald-600">Sim (Amigos ou Familiares) 👥</span> : <span className="text-slate-500">Não 👤</span>}
                        </p>
                      </div>

                      <div>
                        <p className="text-slate-400 font-medium">⌚ DADOS BIOMÉTRICOS (SMARTWATCH)</p>
                        <p className="font-bold text-slate-800 mt-0.5">
                          {sessao.fcMedia ? `FC Média: ${sessao.fcMedia} bpm` : "-"}
                          {sessao.fcMaxima ? ` · FC Máxima: ${sessao.fcMaxima} bpm` : ""}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default HistoricoCalendario;
