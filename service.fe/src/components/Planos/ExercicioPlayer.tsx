import { useState, useRef, useCallback, useEffect } from "react";
import type { ExercicioDoPlano } from "../../services/planosService";
import AvaliacaoExercicio from "./AvaliacaoExercicio";
import { sessoesService } from "../../services/sessoesService";

interface Props {
  exercicio: ExercicioDoPlano;
  idPrescricao: string;
  idPaciente: string;
  modoConvidado?: boolean;
  modoPlano?: boolean;
  exercicioNumero?: number;
  totalExercicios?: number;
  onVoltar: () => void;
  onConcluir: () => void;
}

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

const ExercicioPlayer = ({
  exercicio,
  idPrescricao,
  idPaciente,
  modoConvidado = false,
  modoPlano = false,
  exercicioNumero,
  totalExercicios,
  onVoltar,
  onConcluir,
}: Props) => {
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [materiaisChecked, setMateriaisChecked] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const handleProximoExercicio = async () => {
    setIsSaving(true);
    try {
      await sessoesService.registarSessao({
        id_exercicio: exercicio.id_exercicio,
        id_prescricao: idPrescricao,
        duracao: timeElapsed,
        diversao_1_a_5: 3,
        esforco_1_a_10: 5,
      });
    } catch (err) {
      console.error("Erro ao guardar progresso do exercício intermédio:", err);
    } finally {
      setIsSaving(false);
      onConcluir();
    }
  };

  const videoRef = useRef<HTMLVideoElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const materiais = exercicio.materiais_necessarios
    ? exercicio.materiais_necessarios.split(",").map((m) => m.trim()).filter(Boolean)
    : [];

  const todosMateriaisMarcados =
    materiais.length === 0 || materiaisChecked.length >= materiais.length;

  const startInterval = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setTimeElapsed((prev) => {
        if (prev + 1 >= exercicio.duracao_segundos) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          videoRef.current?.pause();
          setIsFinished(true);
          return exercicio.duracao_segundos;
        }
        return prev + 1;
      });
    }, 1000);
  }, [exercicio.duracao_segundos]);

  useEffect(() => {
    setTimeout(() => {
      videoRef.current?.play().catch(() => {});
    }, 150);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleIniciar = () => {
    setIsStarted(true);
    startInterval();
  };

  const handlePausar = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    videoRef.current?.pause();
    setIsPaused(true);
  };

  const handleRetomar = () => {
    videoRef.current?.play().catch(() => {});
    startInterval();
    setIsPaused(false);
  };

  const handleRecomecar = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimeElapsed(0);
    setIsPaused(false);
    setTimeout(() => {
      videoRef.current?.play().catch(() => {});
      startInterval();
    }, 100);
  };

  const handleConcluir = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    videoRef.current?.pause();
    setIsFinished(true);
    setIsPaused(false);
  };

  const isUltimoExercicio =
    exercicioNumero !== undefined &&
    totalExercicios !== undefined &&
    exercicioNumero >= totalExercicios;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* Barra de cima */}
      <div className="flex items-center justify-between bg-white px-5 py-4 shadow-sm">
        <button
          onClick={onVoltar}
          className="text-sm font-medium text-slate-500 transition hover:text-slate-900"
        >
          ← Voltar
        </button>
        <div className="flex flex-col items-center">
          <h2 className="max-w-xs truncate text-base font-semibold text-slate-900">
            {exercicio.nome_exercicio}
          </h2>
          {modoPlano && exercicioNumero && totalExercicios && (
            <span className="text-xs text-slate-400 font-medium">
              Exercício {exercicioNumero} de {totalExercicios}
            </span>
          )}
          {exercicio.repeticoes != null && exercicio.repeticoes > 0 && (
            <span className="mt-1 rounded-lg bg-blue-600 px-4 py-1 text-sm font-extrabold text-white tracking-wide">
              {exercicio.repeticoes} repetições
            </span>
          )}
        </div>
        <div className="w-16" />
      </div>

      {/* Vídeo + overlays */}
      <div className="relative flex-1 overflow-hidden bg-black">
        {exercicio.url_video ? (
          <video
            ref={videoRef}
            src={exercicio.url_video}
            className="h-full w-full object-contain"
            loop
            playsInline
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">
            Sem vídeo disponível
          </div>
        )}

        {/* Overlay de início */}
        {!isStarted && !isFinished && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-black/60 backdrop-blur-sm overflow-y-auto py-6 px-4">
            <div className="flex flex-col items-center gap-2">
              <span className="text-6xl">💪</span>
              <h3 className="text-2xl font-extrabold text-white">Pronto para começar?</h3>
              <p className="text-sm text-slate-300">O tempo começa a contar quando clicares!</p>
              {modoPlano && exercicioNumero && totalExercicios && (
                <p className="text-xs text-slate-400 bg-white/10 px-3 py-1 rounded-full">
                  Exercício {exercicioNumero} de {totalExercicios}
                </p>
              )}
              {exercicio.repeticoes != null && exercicio.repeticoes > 0 && (
                <p className="text-sm font-bold text-blue-300 bg-white/10 px-4 py-1.5 rounded-full">
                  🔁 Faz {exercicio.repeticoes} repetições
                </p>
              )}
            </div>

            {/* Checklist de materiais — só em exercício individual */}
            {!modoPlano && materiais.length > 0 && (
              <div className="w-full max-w-xs bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-300 mb-3 text-center">
                  ✅ Tens tudo o que precisas?
                </p>
                <div className="flex flex-col gap-2">
                  {materiais.map((m) => (
                    <label key={m} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={materiaisChecked.includes(m)}
                        onChange={() =>
                          setMateriaisChecked((prev) =>
                            prev.includes(m)
                              ? prev.filter((x) => x !== m)
                              : [...prev, m]
                          )
                        }
                        className="w-5 h-5 rounded accent-green-400 cursor-pointer"
                      />
                      <span className={`text-sm transition ${
                        materiaisChecked.includes(m)
                          ? "line-through text-slate-400"
                          : "text-white"
                      }`}>
                        {m}
                      </span>
                    </label>
                  ))}
                </div>
                {!todosMateriaisMarcados && (
                  <p className="mt-3 text-xs text-amber-400 font-medium text-center">
                    ⚠️ Marca todos os materiais antes de começar
                  </p>
                )}
              </div>
            )}

            <button
              onClick={handleIniciar}
              disabled={!modoPlano && !todosMateriaisMarcados}
              className={`flex items-center gap-3 rounded-2xl px-10 py-5 text-xl font-extrabold text-white shadow-lg transition active:scale-95 ${
                !modoPlano && !todosMateriaisMarcados
                  ? "bg-slate-500 cursor-not-allowed"
                  : "bg-green-500 hover:bg-green-400"
              }`}
            >
              <span className="text-2xl">▶️</span> Iniciar!
            </button>
          </div>
        )}

        {/* Overlay de pausa */}
        {isPaused && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-black/70 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-2">
              <span className="text-5xl">⏸️</span>
              <h3 className="text-2xl font-extrabold text-white">Exercício em Pausa</h3>
              <p className="text-sm text-slate-300">O que queres fazer?</p>
            </div>
            <div className="rounded-2xl bg-white/10 px-6 py-3 text-center backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-300">
                Tempo de exercício
              </p>
              <p className="text-4xl font-extrabold tabular-nums text-white">
                {formatTime(timeElapsed)}
              </p>
            </div>
            <div className="flex w-64 flex-col items-center gap-3">
              <button
                onClick={handleRetomar}
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-green-500 px-6 py-4 text-lg font-extrabold text-white shadow-lg transition hover:bg-green-400 active:scale-95"
              >
                <span className="text-2xl">▶️</span> Continuar!
              </button>
              <button
                onClick={handleRecomecar}
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-blue-500 px-6 py-4 text-lg font-extrabold text-white shadow-lg transition hover:bg-blue-400 active:scale-95"
              >
                <span className="text-2xl">🔄</span> Recomeçar
              </button>
              {modoPlano ? (
                <button
                  onClick={handleConcluir}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl bg-emerald-600 px-6 py-4 text-lg font-extrabold text-white shadow-lg transition hover:bg-emerald-500 active:scale-95"
                >
                  <span className="text-2xl">{isUltimoExercicio ? "🏁" : "⏭️"}</span>
                  {isUltimoExercicio ? "Concluir Plano" : "Próximo exercício"}
                </button>
              ) : (
                <button
                  onClick={handleConcluir}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl bg-emerald-600 px-6 py-4 text-lg font-extrabold text-white shadow-lg transition hover:bg-emerald-500 active:scale-95"
                >
                  <span className="text-2xl">🏁</span> Concluir
                </button>
              )}
              <button
                onClick={onVoltar}
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-slate-600 px-6 py-4 text-lg font-extrabold text-white shadow-lg transition hover:bg-slate-500 active:scale-95"
              >
                <span className="text-2xl">🏠</span>
                {modoPlano ? "Sair do plano" : "Sair"}
              </button>
            </div>
          </div>
        )}

        {/* Overlay de fim — convidado */}
        {isFinished && modoConvidado && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-black/80 backdrop-blur-sm">
            <span className="animate-bounce text-7xl">🎉</span>
            <h3 className="text-3xl font-extrabold text-white">Muito bem!</h3>
            <p className="max-w-xs text-center text-slate-300">
              Experimentaste um exercício do +MMAis. Cria uma conta para teres
              o teu plano personalizado e acompanhares o teu progresso!
            </p>
            <button
              onClick={onConcluir}
              className="mt-2 flex items-center gap-3 rounded-2xl bg-emerald-500 px-8 py-4 text-xl font-extrabold text-white shadow-lg transition hover:bg-emerald-400 active:scale-95"
            >
              🏆 Ver outro exercício
            </button>
          </div>
        )}

        {/* Overlay de fim — exercício intermédio do plano: ecrã rápido */}
        {isFinished && modoPlano && !isUltimoExercicio && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-black/80 backdrop-blur-sm">
            <span className="animate-bounce text-7xl">✅</span>
            <h3 className="text-3xl font-extrabold text-white text-center px-4">
              {`Exercício ${exercicioNumero} concluído!`}
            </h3>
            <div className="rounded-2xl bg-white/10 px-8 py-4 text-center backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-300 mb-1">
                XP ganho
              </p>
              <p className="text-4xl font-extrabold text-yellow-400">
                +{exercicio.recompensa_xp} XP
              </p>
            </div>
            <p className="text-sm text-slate-300 text-center px-4">
              A seguir: <span className="font-bold text-white">próximo exercício</span>
            </p>
            <button
              onClick={handleProximoExercicio}
              disabled={isSaving}
              className="mt-2 flex items-center gap-3 rounded-2xl bg-emerald-500 px-10 py-5 text-xl font-extrabold text-white shadow-lg transition hover:bg-emerald-400 active:scale-95 disabled:opacity-50"
            >
              {isSaving ? "A guardar..." : "Próximo exercício →"}
            </button>
          </div>
        )}

        {/* Overlay de fim — último exercício do plano: mostra feedback */}
        {isFinished && modoPlano && isUltimoExercicio && (
          <AvaliacaoExercicio
            idPaciente={idPaciente}
            idExercicio={exercicio.id_exercicio}
            idPrescricao={idPrescricao}
            duracaoSegundos={timeElapsed}
            recompensaXp={exercicio.recompensa_xp}
            onConcluir={onConcluir}
          />
        )}

        {/* Overlay de fim — modo normal (exercício individual) */}
        {isFinished && !modoConvidado && !modoPlano && (
          <AvaliacaoExercicio
            idPaciente={idPaciente}
            idExercicio={exercicio.id_exercicio}
            idPrescricao={idPrescricao}
            duracaoSegundos={timeElapsed}
            recompensaXp={exercicio.recompensa_xp}
            onConcluir={onConcluir}
          />
        )}
      </div>

      {/* Barra de baixo */}
      {isStarted && !isPaused && !isFinished && (
        <div className="flex flex-col items-center gap-3 bg-white px-4 pb-5 pt-4 shadow-[0_-2px_10px_rgba(0,0,0,0.08)]">
          <div className="flex flex-col items-center gap-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              Tempo de exercício
            </p>
            <p className="text-5xl font-extrabold tabular-nums text-slate-900">
              {formatTime(timeElapsed)}
            </p>
            {exercicio.duracao_segundos > 0 && (
              <div className="w-64 h-2 bg-slate-100 rounded-full overflow-hidden mt-1">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min((timeElapsed / exercicio.duracao_segundos) * 100, 100)}%` }}
                />
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handlePausar}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg transition hover:bg-slate-700"
              aria-label="Pausar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            </button>
            <button
              onClick={handleRecomecar}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg transition hover:bg-slate-700"
              aria-label="Recomeçar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
            </button>
            {modoPlano && (
              <button
                onClick={handleConcluir}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg transition hover:bg-emerald-500"
                aria-label="Próximo exercício"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M5 4l15 8-15 8V4z" />
                  <line x1="19" y1="4" x2="19" y2="20" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExercicioPlayer;