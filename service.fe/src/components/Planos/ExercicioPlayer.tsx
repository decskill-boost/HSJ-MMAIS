
import { useState, useRef, useCallback, useEffect } from "react";
import type { ExercicioDoPlano } from "../../services/planosService";
import CapitaoMais from "../CapitaoMais";
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

  // Percentagem de missão cumprida (para a barra de energia)
  const pctFeito = Math.max(
    0,
    Math.min(
      100,
      ((exercicio.duracao_segundos - timeLeft) / exercicio.duracao_segundos) * 100,
    ),
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0A1020]">
      {/* Barra de cima */}
      <div className="flex items-center justify-between border-b-[3px] border-tinta bg-papel-claro px-5 py-3">
        <button
          onClick={onVoltar}
          className="text-sm font-bold text-aco transition hover:text-tinta"
        >
          ← Voltar
        </button>
        <h2 className="max-w-xs truncate font-display text-lg tracking-wide text-tinta">
          {exercicio.nome_exercicio}
        </h2>
        <div className="w-16" />
      </div>

      {/* Vídeo + overlays */}
      <div className="relative flex-1 overflow-hidden bg-[#0A1020]">
        {exercicio.url_video ? (
          <video
            ref={videoRef}
            src={exercicio.url_video}
            className="h-full w-full object-contain"
            loop
            playsInline
          />
        ) : (
          <div className="relative flex h-full flex-col items-center justify-center gap-3 bg-[linear-gradient(160deg,#1D42C8_0%,#16307F_100%)]">
            <div className="fundo-reticula absolute inset-0 opacity-40" aria-hidden="true" />
            <div className="animate-flutuar relative">
              <CapitaoMais className="h-28 w-auto" title="" />
            </div>
            <p className="relative text-sm font-bold text-[#C9D2F2]">
              Sem vídeo — segue o ritmo do Capitão!
            </p>
          </div>
        )}

        {/* Overlay de pausa */}
        {isPaused && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-[linear-gradient(160deg,#1D42C8ee_0%,#16307Fee_100%)] backdrop-blur-sm">
            <div className="fundo-reticula absolute inset-0 opacity-40" aria-hidden="true" />
            <div className="relative flex flex-col items-center gap-2">
              <div className="animate-flutuar">
                <CapitaoMais className="h-24 w-auto" title="" />
              </div>
              <h3 className="texto-autocolante font-display text-3xl tracking-wide">
                Pausa de herói!
              </h3>
              <p className="text-sm font-bold text-[#C9D2F2]">
                Até os heróis recarregam. O que queres fazer?
              </p>
            </div>
            <div className="relative rounded-2xl border-2 border-tinta bg-tinta/40 px-6 py-3 text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-[#C9D2F2]">
                Tempo restante
              </p>
              <p className="font-display text-4xl tabular-nums tracking-wide text-papel">
                {formatTime(timeLeft)}
              </p>
            </div>
            <div className="relative flex w-64 flex-col items-center gap-3">
              <button
                onClick={handleRetomar}
                className="flex w-full items-center justify-center gap-3 rounded-2xl border-[3px] border-tinta bg-linear-to-b from-raio to-raio-fundo px-6 py-4 font-display text-xl tracking-wide text-tinta shadow-vinheta transition hover:brightness-105 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
              >
                ▶ Continuar!
              </button>
              <button
                onClick={handleRecomecar}
                className="flex w-full items-center justify-center gap-3 rounded-2xl border-[3px] border-tinta bg-cobalto-vivo px-6 py-3 text-base font-bold text-papel shadow-vinheta transition hover:bg-cobalto active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
              >
                🔄 Recomeçar
              </button>
              <button
                onClick={onVoltar}
                className="flex w-full items-center justify-center gap-3 rounded-2xl border-[3px] border-tinta bg-transparent px-6 py-3 text-base font-bold text-papel transition hover:bg-tinta/30"
              >
                🏠 Sair
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
        <div className="flex flex-col items-center gap-3 border-t-[3px] border-tinta bg-papel-claro px-4 pb-5 pt-3">
          {/* Barra de energia da missão */}
          <div className="w-full max-w-md">
            <div className="h-3 w-full overflow-hidden rounded-full border-2 border-tinta bg-papel">
              <div
                className="h-full rounded-full bg-linear-to-r from-raio to-raio-fundo transition-all duration-1000"
                style={{ width: `${pctFeito}%` }}
              />
            </div>
          </div>
          <div className="flex flex-col items-center">
            <p className="text-xs font-bold uppercase tracking-widest text-aco">
              Tempo restante
            </p>
            <p
              className={`font-display text-5xl tabular-nums tracking-wide transition-colors ${
                timeLeft <= 10 ? "animate-pulse text-capa-escura" : "text-tinta"
              }`}
            >
              {formatTime(timeLeft)}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handlePausar}
              className="flex h-14 w-14 items-center justify-center rounded-full border-[3px] border-tinta bg-raio text-tinta shadow-vinheta transition hover:bg-raio-fundo active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
              aria-label="Pausar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            </button>
            <button
              onClick={handleRecomecar}
              className="flex h-14 w-14 items-center justify-center rounded-full border-[3px] border-tinta bg-papel-claro text-tinta shadow-vinheta transition hover:bg-papel active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
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
