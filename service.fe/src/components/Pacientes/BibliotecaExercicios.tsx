import { useState, useEffect } from "react";
import { exerciciosService } from "../../services/exercicios";
import type { Exercicio } from "../../services/exercicios";
import type { ExercicioDoPlano } from "../../services/planosService";
import CapitaoMais from "../CapitaoMais";
import LoadingSpinner from "../LoadingSpinner";

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
    repeticoes: ex.repeticoes,
  };
}

const getDifLabel = (v: string) =>
  v === "facil" ? "Fácil" : v === "medio" ? "Médio" : "Difícil";

const getDifColor = (v: string) =>
  v === "facil"
    ? "bg-turbo/15 text-turbo-escuro"
    : v === "medio"
    ? "bg-raio/25 text-tinta"
    : "bg-capa/10 text-capa-escura";

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
        className="mb-6 text-sm font-bold text-aco transition hover:text-tinta"
      >
        ← Voltar
      </button>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <CapitaoMais className="h-12 w-auto animate-balancar" title="" />
          <div>
            <h1 className="font-display text-3xl tracking-wide text-tinta">
              Biblioteca de Treinos ⚡
            </h1>
            <p className="mt-1 text-sm text-aco">
              Escolhe o treino que queres fazer hoje!
            </p>
          </div>
        </div>

        {/* Filtro por condição */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-aco">
            Condição:
          </span>
          {(["Todos", "A", "B", "C"] as FiltroCondicao[]).map((op) => (
            <button
              key={op}
              onClick={() => setFiltro(op)}
              className={`rounded-full border-2 border-tinta px-4 py-1.5 text-sm font-bold transition active:scale-95 ${
                filtro === op
                  ? "bg-cobalto text-papel shadow-vinheta"
                  : "bg-papel-claro text-tinta hover:bg-papel"
              }`}
            >
              {op === "Todos" ? "Todos" : `Nível ${op}`}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner mensagem="A carregar treinos..." />
      ) : lista.length === 0 ? (
        <div className="rounded-(--radius-vinheta) border-[3px] border-tinta bg-papel-claro p-8 text-center shadow-vinheta">
          <div className="mx-auto mb-3 flex justify-center">
            <CapitaoMais className="h-20 w-auto animate-flutuar" title="" />
          </div>
          <p className="text-aco">Nenhum treino encontrado para este filtro.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {lista.map((ex, idx) => (
            <button
              key={ex.id_exercicio}
              onClick={() => onSelecionarExercicio(mapExercicio(ex))}
              className={`entrada-pop${["", "-2", "-3", "-4"][idx % 4]} flex flex-col overflow-hidden rounded-(--radius-vinheta) border-[3px] border-tinta bg-papel-claro text-left shadow-vinheta transition hover:-translate-y-0.5 active:translate-y-0 active:shadow-none`}
            >
              {/* Thumbnail */}
              <div className="relative h-44 w-full flex-shrink-0 border-b-[3px] border-tinta bg-papel">
                {ex.url_video ? (
                  <video
                    src={`${ex.url_video}#t=0.1`}
                    className="h-full w-full object-cover"
                    preload="metadata"
                    muted
                    playsInline
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-tinta/30">
                    <span className="text-4xl">🎬</span>
                  </div>
                )}
                {ex.categoria && (
                  <span className="absolute left-2 top-2 rounded-lg border-2 border-tinta bg-cobalto px-2 py-1 text-xs font-bold text-papel">
                    {ex.categoria}
                  </span>
                )}
                {ex.condicao_paciente && (
                  <span className="absolute right-2 top-2 rounded-lg border-2 border-tinta bg-papel-claro/90 px-2 py-1 text-xs font-bold text-tinta">
                    Cond. {ex.condicao_paciente}
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="flex flex-grow flex-col p-4">
                <h3 className="mb-2 text-base font-bold text-tinta">
                  {ex.nome_exercicio}
                </h3>

                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-papel px-2 py-1 text-aco">
                    ⏱ {formatDuration(ex.duracao_segundos)}
                  </span>
                  <span
                    className={`rounded-full px-2 py-1 font-semibold ${getDifColor(ex.dificuldade_clinica)}`}
                  >
                    💪 {getDifLabel(ex.dificuldade_clinica)}
                  </span>
                  <span className="rounded-full border border-tinta/20 bg-raio/20 px-2 py-1 font-semibold text-tinta">
                    ⭐ +{ex.recompensa_xp} XP
                  </span>
                </div>

                {ex.materiais_necessarios && (
                  <p className="mt-2 line-clamp-1 text-xs font-medium text-cobalto">
                    🛠 {ex.materiais_necessarios}
                  </p>
                )}

                <div className="mt-3 flex justify-end">
                  <span className="text-sm font-bold text-cobalto">
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