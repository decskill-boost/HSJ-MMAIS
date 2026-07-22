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

const getMaterialEmoji = (material: string): string => {
  const l = material.toLowerCase();
  if (l.includes("tapete")) return "🧘";
  if (l.includes("bola")) return "⚽";
  if (l.includes("elástico")) return "🪢";
  if (l.includes("haltere")) return "🏋️";
  if (l.includes("bicicleta")) return "🚴";
  if (l.includes("trx")) return "🤸";
  if (l.includes("anel")) return "⭕";
  if (l.includes("handgrip")) return "✊";
  if (l.includes("ténis")) return "🎾";
  if (l.includes("reação")) return "🎯";
  return "🛠️";
};

const ExercicioPreview = ({ exercicio, onVoltar, onComecar }: Props) => {
  const materiais = exercicio.materiais_necessarios
    ? exercicio.materiais_necessarios.split(",").map((m) => m.trim()).filter(Boolean)
    : [];

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6">
      <button
        onClick={onVoltar}
        className="mb-4 text-sm font-medium text-slate-500 transition hover:text-slate-900"
      >
        ← Voltar
      </button>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        {/* Vídeo */}
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

          {/* Materiais necessários */}
          {materiais.length > 0 && (
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 mb-2">
                🛠 O que precisas para este exercício
              </p>
              <div className="flex flex-wrap gap-2">
                {materiais.map((m) => (
                  <span
                    key={m}
                    className="flex items-center gap-1 rounded-full bg-white border border-blue-200 px-3 py-1 text-xs font-medium text-slate-700"
                  >
                    <span>{getMaterialEmoji(m)}</span>
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Instruções */}
          {exercicio.descricao && (
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">
                Instruções
              </p>
              <p className="text-sm text-slate-700 whitespace-pre-line">
                {exercicio.descricao}
              </p>
            </div>
          )}

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