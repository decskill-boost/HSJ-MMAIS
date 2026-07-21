import { useState, useEffect, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import {
  planosService,
  type PlanoAtivo,
  type ExercicioDoPlano,
} from "../services/planosService";
import type { UserProfile } from "../types/user";
import ExercicioPlayer from "./Planos/ExercicioPlayer";
import ExercicioPreview from "./Planos/ExercicioPreview";

interface LayoutContext {
  user: UserProfile | null;
}

type View =
  | "escolha"
  | "list"
  | "preview"
  | "playing"
  | "plano-list"
  | "plano-preview"
  | "plano-playing"
  | "plano-concluido";

const formatDuration = (segundos: number) => {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m} min`;
  return `${m}m ${s}s`;
};

export const PlanosPaciente = () => {
  const { user } = useOutletContext<LayoutContext>();
  const [planos, setPlanos] = useState<PlanoAtivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("escolha");

  // Fluxo exercício individual
  const [exercicioSelecionado, setExercicioSelecionado] =
    useState<ExercicioDoPlano | null>(null);
  const [planoSelecionadoId, setPlanoSelecionadoId] = useState<string>("");

  // Fluxo plano completo
  const [planoEmCurso, setPlanoEmCurso] = useState<PlanoAtivo | null>(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [exercicioIndex, setExercicioIndex] = useState(0);

  const previewVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!user?.idUser) return;
    Promise.all([
      planosService.getTodosPlanosPorPaciente(user.idUser),
      planosService.getPlanosStandard(),
    ])
      .then(([{ ativo, historico }, standard]) => {
        const pessoais = [ativo, ...historico].filter(Boolean) as PlanoAtivo[];
        setPlanos([...pessoais, ...standard]);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user?.idUser]);

  useEffect(() => {
    if (view === "plano-preview" && previewVideoRef.current) {
      previewVideoRef.current.load();
      previewVideoRef.current.play().catch(() => {});
    }
  }, [previewIndex, view]);

  const abrirPreviewPlano = (plano: PlanoAtivo) => {
    setPlanoEmCurso(plano);
    setPreviewIndex(0);
    setExercicioIndex(0);
    setView("plano-preview");
  };

  const iniciarPlano = () => {
    setExercicioIndex(0);
    setView("plano-playing");
  };

  const avancarPlano = () => {
    if (!planoEmCurso) return;
    const proximo = exercicioIndex + 1;
    if (proximo < planoEmCurso.exercicios.length) {
      setExercicioIndex(proximo);
    } else {
      setView("plano-concluido");
    }
  };

  // ─── plano-playing ─────────────────────────────────────────────────────────
  if (view === "plano-playing" && planoEmCurso) {
    const exercicioAtual = planoEmCurso.exercicios[exercicioIndex];
    return (
      <ExercicioPlayer
        key={`plano-${planoEmCurso.id_plano}-ex-${exercicioIndex}`}
        exercicio={exercicioAtual}
        idPrescricao={planoEmCurso.id_plano}
        idPaciente={user?.idUser ?? ""}
        modoPlano
        exercicioNumero={exercicioIndex + 1}
        totalExercicios={planoEmCurso.exercicios.length}
        onVoltar={() => {
          setPreviewIndex(exercicioIndex);
          setView("plano-preview");
        }}
        onConcluir={avancarPlano}
      />
    );
  }

  // ─── plano-concluido ───────────────────────────────────────────────────────
  if (view === "plano-concluido") {
    const xpTotal =
      planoEmCurso?.exercicios.reduce((acc, ex) => acc + ex.recompensa_xp, 0) ?? 0;
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-24 px-4">
        <span className="animate-bounce text-8xl">🏆</span>
        <h2 className="text-3xl font-extrabold text-slate-900 text-center">
          Plano completo!
        </h2>
        <p className="text-slate-500 text-center max-w-xs">
          Fizeste todos os {planoEmCurso?.exercicios.length} exercícios do plano. És incrível! 🎉
        </p>
        <div className="rounded-2xl bg-yellow-50 border border-yellow-200 px-8 py-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-yellow-600 mb-1">
            XP ganho hoje
          </p>
          <p className="text-4xl font-extrabold text-yellow-500">+{xpTotal} XP</p>
        </div>
        <button
          onClick={() => {
            setPlanoEmCurso(null);
            setExercicioIndex(0);
            setPreviewIndex(0);
            setView("escolha");
          }}
          className="mt-4 rounded-2xl bg-blue-600 px-8 py-4 text-lg font-extrabold text-white shadow-lg transition hover:bg-blue-500 active:scale-95"
        >
          Voltar ao início
        </button>
      </div>
    );
  }

  // ─── plano-preview (carrossel) ─────────────────────────────────────────────
  if (view === "plano-preview" && planoEmCurso) {
    const total = planoEmCurso.exercicios.length;
    const ex = planoEmCurso.exercicios[previewIndex];
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-black">
        <div className="flex items-center justify-between bg-white px-5 py-4 shadow-sm">
          <button
            onClick={() => setView("plano-list")}
            className="text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            ← Voltar
          </button>
          <div className="flex flex-col items-center">
            <h2 className="text-base font-semibold text-slate-900">Tutorial do Plano</h2>
            <span className="text-xs text-slate-400">{previewIndex + 1} / {total}</span>
          </div>
          <div className="w-16" />
        </div>

        <div className="relative flex-1 bg-black overflow-hidden">
          {ex.url_video ? (
            <video
              ref={previewVideoRef}
              src={ex.url_video}
              className="h-full w-full object-contain"
              autoPlay
              muted
              loop
              playsInline
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-400">
              <span className="text-5xl">🎬</span>
              <p className="text-sm">Sem vídeo disponível</p>
            </div>
          )}

          {previewIndex > 0 && (
            <button
              onClick={() => setPreviewIndex((i) => i - 1)}
              className="absolute left-3 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-black/50 text-white text-2xl font-bold backdrop-blur-sm transition hover:bg-black/70 active:scale-95"
            >
              ‹
            </button>
          )}
          {previewIndex < total - 1 && (
            <button
              onClick={() => setPreviewIndex((i) => i + 1)}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-black/50 text-white text-2xl font-bold backdrop-blur-sm transition hover:bg-black/70 active:scale-95"
            >
              ›
            </button>
          )}

          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm rounded-full px-4 py-1.5">
            <p className="text-xs font-semibold text-white">
              Exercício {previewIndex + 1} de {total}
            </p>
          </div>
        </div>

        <div className="bg-white px-5 pt-4 pb-6">
          <h3 className="text-xl font-extrabold text-slate-900">{ex.nome_exercicio}</h3>
          <div className="flex gap-4 mt-1 text-sm text-slate-500">
            <span>⏱ {formatDuration(ex.duracao_segundos)}</span>
            <span>⭐ +{ex.recompensa_xp} XP</span>
          </div>

          <div className="flex justify-center gap-2 my-4">
            {planoEmCurso.exercicios.map((_, i) => (
              <button
                key={i}
                onClick={() => setPreviewIndex(i)}
                className={`h-2 rounded-full transition-all duration-200 ${
                  i === previewIndex ? "w-6 bg-blue-600" : i < previewIndex ? "w-2 bg-blue-300" : "w-2 bg-slate-200"
                }`}
              />
            ))}
          </div>

          <button
            onClick={iniciarPlano}
            className="w-full rounded-2xl bg-blue-600 py-4 text-lg font-extrabold text-white shadow-lg transition hover:bg-blue-500 active:scale-95"
          >
            Iniciar Plano ({total} exercícios) ▶
          </button>
          {previewIndex < total - 1 && (
            <p className="mt-2 text-center text-xs text-slate-400">
              Desliza → para ver todos os {total} exercícios antes de começar
            </p>
          )}
        </div>
      </div>
    );
  }

  // ─── preview (exercício individual) ───────────────────────────────────────
  if (view === "preview" && exercicioSelecionado)
    return (
      <ExercicioPreview
        exercicio={exercicioSelecionado}
        onVoltar={() => setView("list")}
        onComecar={() => setView("playing")}
      />
    );

  // ─── playing (exercício individual) ───────────────────────────────────────
  if (view === "playing" && exercicioSelecionado)
    return (
      <ExercicioPlayer
        exercicio={exercicioSelecionado}
        idPrescricao={planoSelecionadoId}
        idPaciente={user?.idUser ?? ""}
        onVoltar={() => setView("preview")}
        onConcluir={() => {
          setView("escolha");
          setExercicioSelecionado(null);
          setPlanoSelecionadoId("");
        }}
      />
    );

  // ─── escolha ───────────────────────────────────────────────────────────────
  if (view === "escolha") {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-12">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 text-center">
          O que queres fazer hoje? 💪
        </h1>
        <p className="mt-2 text-center text-slate-500">Escolhe como queres treinar!</p>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          <button
            onClick={() => setView("plano-list")}
            className="flex flex-col items-center gap-4 rounded-3xl border-2 border-blue-200 bg-blue-50 p-8 text-center shadow-sm transition hover:border-blue-400 hover:shadow-md active:scale-95"
          >
            <span className="text-6xl">📋</span>
            <div>
              <p className="text-xl font-extrabold text-blue-700">Fazer um plano</p>
              <p className="mt-1 text-sm text-blue-500">Faz todos os exercícios do plano em sequência</p>
            </div>
          </button>

          <button
            onClick={() => setView("list")}
            className="flex flex-col items-center gap-4 rounded-3xl border-2 border-indigo-200 bg-indigo-50 p-8 text-center shadow-sm transition hover:border-indigo-400 hover:shadow-md active:scale-95"
          >
            <span className="text-6xl">⚡</span>
            <div>
              <p className="text-xl font-extrabold text-indigo-700">Fazer um exercício</p>
              <p className="mt-1 text-sm text-indigo-500">Escolhe um exercício específico para fazer</p>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // ─── plano-list ────────────────────────────────────────────────────────────
  if (view === "plano-list") {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-10">
        <button
          onClick={() => setView("escolha")}
          className="mb-6 text-sm font-medium text-slate-500 transition hover:text-slate-900"
        >
          ← Voltar
        </button>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Escolhe um plano 📋</h1>
        <p className="mt-1 text-sm text-slate-500">Podes ver o tutorial de cada exercício antes de começar!</p>

        {loading ? (
          <p className="mt-10 text-sm text-slate-400">A carregar planos...</p>
        ) : planos.filter((p) => p.exercicios.length > 0).length === 0 ? (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <p className="text-slate-500">Ainda não existem planos disponíveis.</p>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {planos.filter((p) => p.exercicios.length > 0).map((plano) => (
              <div key={plano.id_plano} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-wide">
                    Nível {plano.dificuldade}
                  </span>
                  <span className="rounded-full bg-blue-100 px-3 py-0.5 text-xs font-semibold text-blue-700">
                    {plano.exercicios.length} exercícios
                  </span>
                </div>
                {plano.notas_medicas && (
                  <p className="text-xs text-slate-600 italic mb-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    {plano.notas_medicas}
                  </p>
                )}
                <div className="mb-4 space-y-1.5">
                  {plano.exercicios.map((ex, i) => (
                    <div key={ex.id_exercicio} className="flex items-center gap-2 text-xs text-slate-600">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-500 shrink-0">
                        {i + 1}
                      </span>
                      <span className="font-medium flex-1">{ex.nome_exercicio}</span>
                      <span className="text-slate-400 shrink-0">{formatDuration(ex.duracao_segundos)}</span>
                      <span className="text-blue-500 font-semibold shrink-0">+{ex.recompensa_xp}xp</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => abrirPreviewPlano(plano)}
                  className="w-full rounded-xl bg-blue-600 py-3 text-sm font-extrabold text-white transition hover:bg-blue-500 active:scale-95"
                >
                  Ver tutorial e começar ▶
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ─── list (exercícios individuais) ─────────────────────────────────────────
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <button
        onClick={() => setView("escolha")}
        className="mb-6 text-sm font-medium text-slate-500 transition hover:text-slate-900"
      >
        ← Voltar
      </button>
      <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Escolhe um exercício ⚡</h1>
      <p className="mt-1 text-sm text-slate-500">Escolhe o exercício que queres fazer hoje!</p>

      {loading ? (
        <p className="mt-10 text-sm text-slate-400">A carregar exercícios...</p>
      ) : planos.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-slate-500">Ainda não existem planos disponíveis.</p>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {planos.map((plano) => (
            <div key={plano.id_plano} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wide">
                  Intensidade: Nível {plano.dificuldade}
                </span>
              </div>
              {plano.notas_medicas && (
                <p className="text-xs text-slate-600 italic mb-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  {plano.notas_medicas}
                </p>
              )}
              <div className="space-y-2">
                {plano.exercicios.map((ex) => (
                  <button
                    key={ex.id_exercicio}
                    onClick={() => {
                      setExercicioSelecionado(ex);
                      setPlanoSelecionadoId(plano.id_plano);
                      setView("preview");
                    }}
                    className="w-full flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100/80 p-3 text-left transition"
                  >
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{ex.nome_exercicio}</p>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                        ⏱ {formatDuration(ex.duracao_segundos)} · +{ex.recompensa_xp} XP
                      </p>
                    </div>
                    <span className="text-indigo-600 text-sm font-bold shrink-0">Começar →</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlanosPaciente;