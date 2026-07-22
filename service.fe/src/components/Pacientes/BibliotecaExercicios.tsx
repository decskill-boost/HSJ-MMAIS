import { useState, useEffect } from "react";
import { exerciciosService } from "../../services/exercicios";
import type { Exercicio } from "../../services/exercicios";
import type { ExercicioDoPlano } from "../../services/planosService";

interface Props {
  onVoltar: () => void;
  onSelecionarExercicio: (exercicio: ExercicioDoPlano) => void;
}

type FiltroCondicao = "Todos" | "A" | "B" | "C";

function mapExercicio(ex: Exercicio): ExercicioDoPlano {
  const difMap: Record<string, number> = { facil: 1, medio: 5, dificil: 8 };
  return {
    id_exercicio: ex.id_exercicio,
    nome_exercicio: ex.nome_exercicio,
    duracao_segundos: ex.duracao_segundos,
    dificuldade_clinica: difMap[ex.dificuldade_clinica] ?? 1,
    recompensa_xp: ex.recompensa_xp,
    url_video: ex.url_video ?? "",
    categoria: ex.categoria,
    materiais_necessarios: ex.materiais_necessarios,
    condicao_paciente: ex.condicao_paciente,
    descricao: ex.descricao,
  };
}

const getDifLabel = (v: string) =>
  v === "facil" ? "Fácil" : v === "medio" ? "Médio" : "Difícil";

const getDifColor = (v: string) =>
  v === "facil"
    ? "bg-green-100 text-green-700"
    : v === "medio"
    ? "bg-yellow-100 text-yellow-700"
    : "bg-red-100 text-red-700";

const formatDuration = (s: number) => {
  const m = Math.floor(s / 60);
  const ss = s % 60;
  if (m === 0) return `${ss}s`;
  if (ss === 0) return `${m} min`;
  return `${m}m ${ss}s`;
};

const BibliotecaExercicios = ({ onVoltar, onSelecionarExercicio }: Props) => {
  const [exercicios, setExercicios] = useState<Exercicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<FiltroCondicao>("Todos");

  useEffect(() => {
    exerciciosService
      .getAll()
      .then((data) => setExercicios(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const lista =
    filtro === "Todos"
      ? exercicios
      : exercicios.filter((ex) => ex.condicao_paciente === filtro);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <button
        onClick={onVoltar}
        className="mb-6 text-sm font-medium text-slate-500 transition hover:text-slate-900"
      >
        ← Voltar
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Biblioteca de Exercícios ⚡
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Escolhe o exercício que queres fazer hoje!
          </p>
        </div>

        {/* Filtro por condição */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Condição:
          </span>
          {(["Todos", "A", "B", "C"] as FiltroCondicao[]).map((op) => (
            <button
              key={op}
              onClick={() => setFiltro(op)}
              className={`rounded-full px-4 py-1.5 text-sm font-bold transition ${
                filtro === op
                  ? "bg-blue-600 text-white shadow"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              {op === "Todos" ? "Todos" : `Nível ${op}`}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">A carregar exercícios...</p>
      ) : lista.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-slate-500">Nenhum exercício encontrado.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {lista.map((ex) => (
            <button
              key={ex.id_exercicio}
              onClick={() => onSelecionarExercicio(mapExercicio(ex))}
              className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition text-left flex flex-col"
            >
              {/* Thumbnail */}
              <div className="relative w-full h-44 bg-slate-100 flex-shrink-0">
                {ex.url_video ? (
                  <video
                    src={ex.url_video}
                    className="w-full h-full object-cover"
                    preload="metadata"
                    muted
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <span className="text-4xl">🎬</span>
                  </div>
                )}
                {ex.categoria && (
                  <span className="absolute top-2 left-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-lg">
                    {ex.categoria}
                  </span>
                )}
                {ex.condicao_paciente && (
                  <span className="absolute top-2 right-2 bg-white/90 text-slate-700 text-xs font-bold px-2 py-1 rounded-lg">
                    Cond. {ex.condicao_paciente}
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="p-4 flex flex-col flex-grow">
                <h3 className="font-bold text-slate-900 text-base mb-2">
                  {ex.nome_exercicio}
                </h3>

                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                    ⏱ {formatDuration(ex.duracao_segundos)}
                  </span>
                  <span
                    className={`px-2 py-1 rounded-full font-semibold ${getDifColor(ex.dificuldade_clinica)}`}
                  >
                    💪 {getDifLabel(ex.dificuldade_clinica)}
                  </span>
                  <span className="bg-yellow-50 text-yellow-700 px-2 py-1 rounded-full font-semibold">
                    ⭐ +{ex.recompensa_xp} XP
                  </span>
                </div>

                {ex.materiais_necessarios && (
                  <p className="mt-2 text-xs text-blue-600 font-medium line-clamp-1">
                    🛠 {ex.materiais_necessarios}
                  </p>
                )}

                <div className="mt-3 flex justify-end">
                  <span className="text-indigo-600 text-sm font-bold">
                    Começar →
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default BibliotecaExercicios;