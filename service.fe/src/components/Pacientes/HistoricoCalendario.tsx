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
            <ul className="mt-2 space-y-2">
              {diaSelecionado.sessoes.map((sessao) => (
                <li key={sessao.idSessao} className="text-sm text-slate-600">
                  {sessao.nomeExercicio} — {SESSAO_STATUS_LABELS[sessao.status]}
                  {sessao.esforco != null && ` · esforço ${sessao.esforco}/10`}
                  {sessao.diversao != null && ` · diversão ${sessao.diversao}/5`}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default HistoricoCalendario;
