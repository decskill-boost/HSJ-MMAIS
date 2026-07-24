import { useState, useRef, useCallback, useEffect } from "react";
import type { ExercicioDoPlano } from "../../services/planosService";
import AvaliacaoExercicio from "./AvaliacaoExercicio";
import { sessoesService } from "../../services/sessoesService";
import CapitaoMais from "../CapitaoMais";

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

  // Reta final: o cronómetro pulsa nos últimos 10 segundos (dramatismo de BD)
  const quaseNoFim =
    exercicio.duracao_segundos > 0 &&
    timeElapsed >= exercicio.duracao_segundos - 10 &&
    timeElapsed < exercicio.duracao_segundos;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-tinta">
      {/* Barra de cima */}
      <div className="flex items-center justify-between border-b-[3px] border-tinta bg-papel-claro px-5 py-4">
        <button
          onClick={onVoltar}
          className="text-sm font-bold text-aco transition hover:text-tinta"
        >
          ← Voltar
        </button>
        <div className="flex flex-col items-center">
          <h2 className="max-w-xs truncate text-base font-bold text-tinta">
            {exercicio.nome_exercicio}
          </h2>
          {modoPlano && exercicioNumero && totalExercicios && (
            <span className="text-xs font-medium text-aco">
              Treino {exercicioNumero} de {totalExercicios}
            </span>
          )}
          {exercicio.repeticoes != null && exercicio.repeticoes > 0 && (
            <span className="mt-1 rounded-lg border-2 border-tinta bg-cobalto px-4 py-1 text-sm font-extrabold tracking-wide text-papel">
              {exercicio.repeticoes} repetições
            </span>
          )}
        </div>
        <div className="w-16" />
      </div>

      {/* Vídeo + overlays */}
      <div className="relative flex-1 overflow-hidden bg-tinta">
        {exercicio.url_video ? (
          <video
            ref={videoRef}
            src={exercicio.url_video}
            className="h-full w-full object-contain"
            loop
            playsInline
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-sm text-papel/70">
            <CapitaoMais className="h-24 w-auto animate-flutuar" title="" />
            <span>Sem vídeo — segue as instruções do teu treino!</span>
          </div>
        )}

        {/* Overlay de início */}
        {!isStarted && !isFinished && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 overflow-y-auto bg-tinta/70 px-4 py-6 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-2">
              <span className="text-6xl">💪</span>
              <h3 className="font-display text-3xl tracking-wide text-papel">Pronto para começar?</h3>
              <p className="text-sm text-papel/80">O tempo começa a contar quando tocares!</p>
              {modoPlano && exercicioNumero && totalExercicios && (
                <p className="rounded-full bg-papel/10 px-3 py-1 text-xs text-[#EAEFFF]">
                  Treino {exercicioNumero} de {totalExercicios}
                </p>
              )}
              {exercicio.repeticoes != null && exercicio.repeticoes > 0 && (
                <p className="rounded-full bg-papel/10 px-4 py-1.5 text-sm font-bold text-raio">
                  🔁 Faz {exercicio.repeticoes} repetições
                </p>
              )}
            </div>

            {/* Checklist de materiais — só em exercício individual */}
            {!modoPlano && materiais.length > 0 && (
              <div className="w-full max-w-xs rounded-2xl border-2 border-papel/20 bg-papel/10 p-4 backdrop-blur-sm">
                <p className="mb-3 text-center text-xs font-bold uppercase tracking-widest text-[#EAEFFF]">
                  ✅ Tens tudo o que precisas?
                </p>
                <div className="flex flex-col gap-2">
                  {materiais.map((m) => (
                    <label key={m} className="flex cursor-pointer items-center gap-3">
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
                        className="h-5 w-5 cursor-pointer rounded accent-turbo"
                      />
                      <span className={`text-sm transition ${
                        materiaisChecked.includes(m)
                          ? "text-papel/50 line-through"
                          : "text-papel"
                      }`}>
                        {m}
                      </span>
                    </label>
                  ))}
                </div>
                {!todosMateriaisMarcados && (
                  <p className="mt-3 text-center text-xs font-medium text-raio">
                    ⚠️ Marca todos os materiais antes de começar
                  </p>
                )}
              </div>
            )}

            <button
              onClick={handleIniciar}
              disabled={!modoPlano && !todosMateriaisMarcados}
              className={`flex items-center gap-3 rounded-(--radius-vinheta) border-[3px] border-tinta px-10 py-5 font-display text-xl tracking-wide shadow-vinheta transition active:scale-95 active:shadow-none ${
                !modoPlano && !todosMateriaisMarcados
                  ? "cursor-not-allowed bg-aco text-papel/70"
                  : "bg-turbo text-tinta hover:brightness-105"
              }`}
            >
              <span className="text-2xl">▶️</span> Iniciar!
            </button>
          </div>
        )}

        {/* Overlay de pausa */}
        {isPaused && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-tinta/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-2">
              <span className="text-5xl">⏸️</span>
              <h3 className="font-display text-3xl tracking-wide text-papel">Pausa de herói!</h3>
              <p className="text-sm text-papel/80">O que queres fazer?</p>
            </div>
            <div className="rounded-2xl border-2 border-papel/20 bg-papel/10 px-6 py-3 text-center backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#EAEFFF]">
                Tempo de treino
              </p>
              <p className="font-display text-4xl tabular-nums tracking-wide text-papel">
                {formatTime(timeElapsed)}
              </p>
            </div>
            <div className="flex w-64 flex-col items-center gap-3">
              <button
                onClick={handleRetomar}
                className="flex w-full items-center justify-center gap-3 rounded-(--radius-vinheta) border-[3px] border-tinta bg-turbo px-6 py-4 font-display text-lg tracking-wide text-tinta shadow-vinheta transition hover:brightness-105 active:scale-95 active:shadow-none"
              >
                <span className="text-2xl">▶️</span> Continuar!
              </button>
              <button
                onClick={handleRecomecar}
                className="flex w-full items-center justify-center gap-3 rounded-(--radius-vinheta) border-[3px] border-tinta bg-cobalto-vivo px-6 py-4 font-display text-lg tracking-wide text-papel shadow-vinheta transition hover:bg-cobalto active:scale-95 active:shadow-none"
              >
                <span className="text-2xl">🔄</span> Recomeçar
              </button>
              {modoPlano ? (
                <button
                  onClick={handleConcluir}
                  className="flex w-full items-center justify-center gap-3 rounded-(--radius-vinheta) border-[3px] border-tinta bg-raio px-6 py-4 font-display text-lg tracking-wide text-tinta shadow-vinheta transition hover:brightness-105 active:scale-95 active:shadow-none"
                >
                  <span className="text-2xl">{isUltimoExercicio ? "🏁" : "⏭️"}</span>
                  {isUltimoExercicio ? "Concluir Plano" : "Próximo treino"}
                </button>
              ) : (
                <button
                  onClick={handleConcluir}
                  className="flex w-full items-center justify-center gap-3 rounded-(--radius-vinheta) border-[3px] border-tinta bg-raio px-6 py-4 font-display text-lg tracking-wide text-tinta shadow-vinheta transition hover:brightness-105 active:scale-95 active:shadow-none"
                >
                  <span className="text-2xl">🏁</span> Concluir
                </button>
              )}
              <button
                onClick={onVoltar}
                className="flex w-full items-center justify-center gap-3 rounded-(--radius-vinheta) border-[3px] border-tinta bg-papel/10 px-6 py-4 font-display text-lg tracking-wide text-papel shadow-vinheta transition hover:bg-papel/20 active:scale-95 active:shadow-none"
              >
                <span className="text-2xl">🏠</span>
                {modoPlano ? "Sair do plano" : "Sair"}
              </button>
            </div>
          </div>
        )}

        {/* Overlay de fim — convidado */}
        {isFinished && modoConvidado && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-tinta/85 px-4 backdrop-blur-sm">
            <span className="animate-bounce text-7xl">🎉</span>
            <h3 className="font-display text-4xl tracking-wide text-papel">Muito bem!</h3>
            <p className="max-w-xs text-center text-papel/80">
              Experimentaste um treino MMAIS+. Cria uma conta para teres o teu
              plano personalizado e acompanhares as tuas conquistas!
            </p>
            <button
              onClick={onConcluir}
              className="mt-2 flex items-center gap-3 rounded-(--radius-vinheta) border-[3px] border-tinta bg-raio px-8 py-4 font-display text-xl tracking-wide text-tinta shadow-vinheta transition hover:brightness-105 active:scale-95 active:shadow-none"
            >
              🏆 Ver outro treino
            </button>
          </div>
        )}

        {/* Overlay de fim — exercício intermédio do plano: ecrã rápido */}
        {isFinished && modoPlano && !isUltimoExercicio && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-tinta/85 backdrop-blur-sm">
            <span className="animate-bounce text-7xl">✅</span>
            <h3 className="px-4 text-center font-display text-4xl tracking-wide text-papel">
              {`Treino ${exercicioNumero} concluído!`}
            </h3>
            <div className="rounded-2xl border-2 border-papel/20 bg-papel/10 px-8 py-4 text-center backdrop-blur-sm">
              <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-[#EAEFFF]">
                XP ganho
              </p>
              <p className="font-display text-5xl tracking-wide text-raio [text-shadow:2px_2px_0_#141F3C]">
                +{exercicio.recompensa_xp} XP
              </p>
            </div>
            <p className="px-4 text-center text-sm text-papel/80">
              A seguir: <span className="font-bold text-papel">próximo treino</span>
            </p>
            <button
              onClick={handleProximoExercicio}
              disabled={isSaving}
              className="mt-2 flex items-center gap-3 rounded-(--radius-vinheta) border-[3px] border-tinta bg-raio px-10 py-5 font-display text-xl tracking-wide text-tinta shadow-vinheta transition hover:brightness-105 active:scale-95 active:shadow-none disabled:opacity-50"
            >
              {isSaving ? "A guardar..." : "Próximo treino →"}
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
        <div className="flex flex-col items-center gap-3 border-t-[3px] border-tinta bg-papel-claro px-4 pb-5 pt-4">
          <div className="flex flex-col items-center gap-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-aco">
              Tempo de treino
            </p>
            <p
              className={`font-display text-6xl tabular-nums tracking-wide text-tinta ${
                quaseNoFim ? "animate-pulse text-capa" : ""
              }`}
            >
              {formatTime(timeElapsed)}
            </p>
            {exercicio.duracao_segundos > 0 && (
              <div className="mt-1 h-2.5 w-64 overflow-hidden rounded-full border border-tinta/15 bg-tinta/10">
                <div
                  className="h-full rounded-full bg-cobalto transition-all duration-1000"
                  style={{ width: `${Math.min((timeElapsed / exercicio.duracao_segundos) * 100, 100)}%` }}
                />
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handlePausar}
              className="flex h-14 w-14 items-center justify-center rounded-full border-[3px] border-tinta bg-tinta text-papel shadow-vinheta transition hover:bg-aco active:scale-95 active:shadow-none"
              aria-label="Pausar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            </button>
            <button
              onClick={handleRecomecar}
              className="flex h-14 w-14 items-center justify-center rounded-full border-[3px] border-tinta bg-tinta text-papel shadow-vinheta transition hover:bg-aco active:scale-95 active:shadow-none"
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
                className="flex h-14 w-14 items-center justify-center rounded-full border-[3px] border-tinta bg-raio text-tinta shadow-vinheta transition hover:brightness-105 active:scale-95 active:shadow-none"
                aria-label="Próximo treino"
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
