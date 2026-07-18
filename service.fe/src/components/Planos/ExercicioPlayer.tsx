import { useState, useRef, useCallback, useEffect } from "react";
import type { ExercicioDoPlano } from "../../services/planosService";
import AvaliacaoExercicio from "./AvaliacaoExercicio";

interface Props {
  exercicio: ExercicioDoPlano;
  idPrescricao: string;
  idPaciente: string;
  onVoltar: () => void;
  onConcluir: () => void;
}

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

const ExercicioPlayer = ({ exercicio, idPrescricao, idPaciente, onVoltar, onConcluir }: Props) => {
  const [timeLeft, setTimeLeft] = useState(exercicio.duracao_segundos);
  const [isPaused, setIsPaused] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startInterval = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          setIsFinished(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    setTimeout(() => {
      videoRef.current?.play().catch(() => {});
      startInterval();
    }, 150);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startInterval]);

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
    videoRef.current?.pause();
    setTimeLeft(exercicio.duracao_segundos);
    setIsPaused(false);
    setIsFinished(false);
    setTimeout(() => {
      videoRef.current?.play().catch(() => {});
      startInterval();
    }, 100);
  };

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
        <h2 className="max-w-xs truncate text-base font-semibold text-slate-900">
          {exercicio.nome_exercicio}
        </h2>
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
                Tempo restante
              </p>
              <p className="text-4xl font-extrabold tabular-nums text-white">
                {formatTime(timeLeft)}
              </p>
            </div>

            <div className="flex w-56 flex-col items-center gap-3">
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
              <button
                onClick={onVoltar}
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-slate-600 px-6 py-4 text-lg font-extrabold text-white shadow-lg transition hover:bg-slate-500 active:scale-95"
              >
                <span className="text-2xl">🏠</span> Sair
              </button>
            </div>
          </div>
        )}

        {/* Overlay de avaliação */}
        {isFinished && (
          <AvaliacaoExercicio
            idPaciente={idPaciente}
            idExercicio={exercicio.id_exercicio}
            idPrescricao={idPrescricao}
            duracaoSegundos={exercicio.duracao_segundos}
            recompensaXp={exercicio.recompensa_xp}
            onConcluir={onConcluir}
          />
        )}
      </div>

      {/* Barra de baixo */}
      {!isPaused && !isFinished && (
        <div className="flex flex-col items-center gap-3 bg-white px-4 pb-5 pt-4 shadow-[0_-2px_10px_rgba(0,0,0,0.08)]">
          <div className="flex flex-col items-center gap-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              Tempo restante
            </p>
            <p className={`text-5xl font-extrabold tabular-nums transition-colors ${
              timeLeft <= 10 ? "text-red-500" : "text-slate-900"
            }`}>
              {formatTime(timeLeft)}
            </p>
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
          </div>
        </div>
      )}
    </div>
  );
};

export default ExercicioPlayer;