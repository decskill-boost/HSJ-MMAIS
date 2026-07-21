import type { ExercicioDoPlano } from "../../services/planosService";

interface Props {
  exercicio: ExercicioDoPlano;
  onVoltar: () => void;
  onComecar: () => void;
}

const getDificuldadeLabel = (value: number) => {
  if (value <= 3) return "Fácil";
  if (value <= 6) return "Médio";
  return "Difícil";
};

const getDificuldadeColor = (value: number) => {
  if (value <= 3) return "bg-green-100 text-green-700";
  if (value <= 6) return "bg-yellow-100 text-yellow-700";
  return "bg-red-100 text-red-700";
};

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

const ExercicioPreview = ({ exercicio, onVoltar, onComecar }: Props) => {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6">
      <button
        onClick={onVoltar}
        className="mb-4 text-sm font-medium text-slate-500 transition hover:text-slate-900"
      >
        ← Voltar ao plano
      </button>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="overflow-hidden rounded-2xl bg-black shadow-lg">
          {exercicio.url_video ? (
            <video
              src={exercicio.url_video}
              className="w-full max-h-96 object-contain"
              autoPlay
              muted
              loop
              playsInline
            />
          ) : (
            <div className="flex h-48 items-center justify-center text-sm text-slate-400">
              Sem vídeo disponível
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-extrabold text-slate-900">
            {exercicio.nome_exercicio}
          </h2>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Duração
              </p>
              <p className="mt-0.5 text-lg font-bold text-slate-900">
                {formatTime(exercicio.duracao_segundos)}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                XP
              </p>
              <p className="mt-0.5 text-lg font-bold text-blue-600">
                +{exercicio.recompensa_xp} XP
              </p>
            </div>
            <div className="col-span-2 rounded-xl bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Dificuldade
              </p>
              <span className={`mt-1 inline-flex rounded-full px-3 py-0.5 text-sm font-semibold ${getDificuldadeColor(exercicio.dificuldade_clinica)}`}>
                {getDificuldadeLabel(exercicio.dificuldade_clinica)}
              </span>
            </div>
          </div>

          <button
            onClick={onComecar}
            className="mt-auto rounded-xl bg-blue-600 py-2.5 text-base font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            Começar exercício ▶
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExercicioPreview;