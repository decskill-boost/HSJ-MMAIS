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
  if (value <= 3) return "bg-turbo/15 text-turbo-escuro";
  if (value <= 6) return "bg-raio/25 text-tinta";
  return "bg-capa/20 text-capa-escura";
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
        className="mb-4 text-sm font-medium text-aco transition hover:text-tinta"
      >
        ← Voltar
      </button>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        {/* Vídeo */}
        <div className="overflow-hidden rounded-2xl bg-tinta shadow-lg">
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
            <div className="flex h-48 items-center justify-center text-sm text-papel">
              Sem vídeo disponível
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-extrabold text-tinta">
            {exercicio.nome_exercicio}
          </h2>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-papel p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-aco">
                Duração
              </p>
              <p className="mt-0.5 text-lg font-bold text-tinta">
                {formatTime(exercicio.duracao_segundos)}
              </p>
            </div>
            <div className="rounded-xl bg-papel p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-aco">
                XP
              </p>
              <p className="mt-0.5 text-lg font-bold text-cobalto">
                +{exercicio.recompensa_xp} XP
              </p>
            </div>
            <div className="col-span-2 rounded-xl bg-papel p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-aco">
                Intensidade
              </p>
              <span className={`mt-1 inline-flex rounded-full px-3 py-0.5 text-sm font-semibold ${getDificuldadeColor(exercicio.dificuldade_clinica)}`}>
                {getDificuldadeLabel(exercicio.dificuldade_clinica)}
              </span>
            </div>
          </div>

          {/* Materiais necessários */}
          {materiais.length > 0 && (
            <div className="rounded-xl border border-cobalto/20 bg-cobalto/5 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-cobalto mb-2">
                🛠 O que precisas para este exercício
              </p>
              <div className="flex flex-wrap gap-2">
                {materiais.map((m) => (
                  <span
                    key={m}
                    className="flex items-center gap-1 rounded-full bg-papel-claro border border-cobalto/20 px-3 py-1 text-xs font-medium text-tinta"
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
            <div className="rounded-xl bg-papel p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-aco mb-1">
                Instruções
              </p>
              <p className="text-sm text-tinta whitespace-pre-line">
                {exercicio.descricao}
              </p>
            </div>
          )}

          <button
            onClick={onComecar}
            className="mt-auto rounded-xl bg-cobalto py-2.5 text-base font-semibold text-papel shadow-sm transition hover:bg-cobalto-vivo"
          >
            Começar exercício ▶
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExercicioPreview;