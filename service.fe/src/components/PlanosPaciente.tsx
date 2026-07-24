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
import BibliotecaExercicios from "./Pacientes/BibliotecaExercicios";
import LoadingSpinner from "./LoadingSpinner";
import CapitaoMais from "./CapitaoMais";
import CapitaoMais25D from "./CapitaoMais25D";

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

// Dificuldade em tom encorajador (voz da Academia — nunca desanimar a criança).
// Fundos SÓLIDOS porque o badge assenta por cima do vídeo da capa. Sem emoji:
// a esta escala não se percebia (o 🌱 verde sobre o verde-água desaparecia) e
// a cor + a palavra já comunicam o nível.
const infoDificuldade = (d?: string) => {
  switch ((d ?? "").toLowerCase()) {
    case "facil":
      return { label: "Fácil", chip: "bg-turbo text-tinta" };
    case "medio":
      return { label: "Médio", chip: "bg-raio text-tinta" };
    case "dificil":
      return { label: "Puxado", chip: "bg-capa-escura text-papel" };
    default:
      return { label: d || "Treino", chip: "bg-cobalto text-papel" };
  }
};

// Classe de entrada em cascata (evita entrada-pop-1 inexistente)
const cascata = (idx: number) => `entrada-pop${["", "-2", "-3", "-4"][idx % 4]}`;

// Emoji do material, para a criança reconhecer pelo desenho e não só pelo texto
const emojiMaterial = (material: string): string => {
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

/**
 * Capa do cartão de plano. A criança vê SEMPRE uma capa bonita (Capitão sobre
 * cobalto); o frame do vídeo entra por cima com fade só quando estiver pronto.
 * O vídeo só começa a carregar quando o cartão se aproxima do ecrã — os vídeos
 * são pesados (alguns 4K) e não podem bloquear o ecrã num tablet de enfermaria.
 */
const CapaPlano = ({ url }: { url?: string }) => {
  const [visivel, setVisivel] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !url) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisivel(true);
          io.disconnect();
        }
      },
      { rootMargin: "300px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [url]);

  return (
    <div
      ref={ref}
      className="relative h-40 w-full flex-shrink-0 overflow-hidden border-b-[3px] border-tinta bg-[linear-gradient(135deg,#3D6BFF_0%,#1D42C8_100%)]"
    >
      {/* capa base — sempre visível, nunca deixa o cartão vazio */}
      <div className="fundo-reticula absolute inset-0 opacity-40" aria-hidden="true" />
      {/* Capitão encostado ao canto para não ficar por baixo do botão de play */}
      <div className="absolute bottom-1 left-3">
        <CapitaoMais className="h-16 w-auto animate-flutuar" title="" />
      </div>

      {/*
        O vídeo fica SEMPRE visível por cima da capa: quando o browser pinta o
        frame, tapa o Capitão; enquanto não pinta, o elemento é transparente e
        vê-se a capa por baixo. Não depende de eventos de media (o `loadeddata`
        não dispara em Chromium com preload="metadata" e deixava isto invisível).
      */}
      {url && visivel && (
        <video
          src={`${url}#t=0.1`}
          className="absolute inset-0 h-full w-full object-cover"
          preload="metadata"
          muted
          playsInline
        />
      )}
      <div
        className="absolute inset-0 bg-gradient-to-t from-tinta/50 to-transparent"
        aria-hidden="true"
      />
    </div>
  );
};

export const PlanosPaciente = () => {
  const { user } = useOutletContext<LayoutContext>();
  const [planos, setPlanos] = useState<PlanoAtivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("escolha");
  const [filtroCondicao, setFiltroCondicao] = useState<string>("Todos");

  // Fluxo exercício individual
  const [exercicioSelecionado, setExercicioSelecionado] =
    useState<ExercicioDoPlano | null>(null);
  const [planoSelecionadoId, setPlanoSelecionadoId] = useState<string>("");

  // Fluxo plano completo
  const [planoEmCurso, setPlanoEmCurso] = useState<PlanoAtivo | null>(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [exercicioIndex, setExercicioIndex] = useState(0);
  const [materiaisPlanoChecked, setMateriaisPlanoChecked] = useState<string[]>([]);

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
    setMateriaisPlanoChecked([]);
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
      <div className="flex flex-col items-center justify-center gap-6 py-16 px-4">
        <CapitaoMais25D />
        <h2 className="text-3xl font-display text-tinta text-center">
          Missão cumprida, herói! 🏆
        </h2>
        <p className="text-aco text-center max-w-xs">
          Fizeste todos os {planoEmCurso?.exercicios.length} exercícios do plano. És incrível! 🎉
        </p>
        <div className="rounded-(--radius-vinheta) bg-raio/15 border-[3px] border-tinta px-8 py-4 text-center shadow-vinheta">
          <p className="text-xs font-semibold uppercase tracking-widest text-raio-fundo mb-1">
            XP ganho hoje
          </p>
          <p className="text-4xl font-display text-raio-fundo">+{xpTotal} XP</p>
        </div>
        <button
          onClick={() => {
            setPlanoEmCurso(null);
            setExercicioIndex(0);
            setPreviewIndex(0);
            setView("escolha");
          }}
          className="mt-4 rounded-2xl bg-cobalto px-8 py-4 text-lg font-display text-papel-claro shadow-vinheta transition hover:bg-cobalto-vivo active:scale-95"
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

    const todosMateriaisPlano = [
      ...new Set(
        planoEmCurso.exercicios.flatMap((e) =>
          e.materiais_necessarios
            ? e.materiais_necessarios.split(",").map((m) => m.trim()).filter(Boolean)
            : []
        )
      ),
    ];
    const todosMarcados =
      todosMateriaisPlano.length === 0 ||
      todosMateriaisPlano.every((m) => materiaisPlanoChecked.includes(m));

    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-tinta">
        <div className="flex items-center justify-between bg-papel-claro px-5 py-4 shadow-vinheta">
          <button
            onClick={() => setView("plano-list")}
            className="text-sm font-medium text-aco transition hover:text-tinta"
          >
            ← Voltar
          </button>
          <div className="flex flex-col items-center">
            <h2 className="font-display text-xl tracking-wide text-tinta">
              Espreita o teu plano
            </h2>
            <span className="text-xs font-bold text-aco">
              Treino {previewIndex + 1} de {total}
            </span>
          </div>
          <div className="w-16" />
        </div>

        <div className="relative flex-1 overflow-hidden bg-tinta">
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
            <div className="flex h-full flex-col items-center justify-center gap-3 text-aco">
              <span className="text-5xl">🎬</span>
              <p className="text-sm">Sem vídeo disponível</p>
            </div>
          )}

          {/* Setas do carrossel — só visíveis quando checklist está completa */}
          {/* Setas grandes da marca — antes eram caracteres finos sobre preto e
              praticamente não se viam no letterbox do vídeo */}
          {todosMarcados && previewIndex > 0 && (
            <button
              onClick={() => setPreviewIndex((i) => i - 1)}
              aria-label="Treino anterior"
              className="absolute left-4 top-1/2 flex h-16 w-16 -translate-y-1/2 items-center justify-center rounded-full border-[3px] border-tinta bg-papel-claro text-tinta shadow-vinheta transition hover:bg-papel active:scale-95 active:shadow-none"
            >
              <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          )}
          {todosMarcados && previewIndex < total - 1 && (
            <button
              onClick={() => setPreviewIndex((i) => i + 1)}
              aria-label="Treino seguinte"
              className="absolute right-4 top-1/2 flex h-16 w-16 -translate-y-1/2 items-center justify-center rounded-full border-[3px] border-tinta bg-raio text-tinta shadow-vinheta transition hover:brightness-105 active:scale-95 active:shadow-none"
            >
              <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          )}

          {todosMarcados && (
            <div className="absolute left-1/2 top-4 -translate-x-1/2 rounded-full border-2 border-tinta bg-papel-claro px-4 py-1.5 shadow-vinheta">
              <p className="text-xs font-bold text-tinta">
                Treino {previewIndex + 1} de {total}
              </p>
            </div>
          )}

          {/* Overlay de checklist — estilo igual ao ExercicioPlayer */}
          {todosMateriaisPlano.length > 0 && !todosMarcados && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 overflow-y-auto bg-[linear-gradient(160deg,#1D42C8_0%,#141F3C_100%)] px-4 py-6">
              <div className="fundo-reticula absolute inset-0 opacity-30" aria-hidden="true" />

              <div className="entrada-pop relative flex flex-col items-center gap-2">
                <CapitaoMais className="h-20 w-auto animate-flutuar" title="" />
                <h3 className="text-center font-display text-3xl tracking-wide text-papel">
                  Preparado, herói?
                </h3>
                <p className="text-center text-sm text-[#EAEFFF]">
                  Toca no que já tens à mão
                </p>
              </div>

              {/* Alvos grandes de toque (≥64px) em vez de checkboxes minúsculos */}
              <div className="entrada-pop-2 relative flex w-full max-w-sm flex-col gap-3">
                {todosMateriaisPlano.map((m) => {
                  const temMaterial = materiaisPlanoChecked.includes(m);
                  return (
                    <button
                      key={m}
                      type="button"
                      aria-pressed={temMaterial}
                      onClick={() =>
                        setMateriaisPlanoChecked((prev) =>
                          prev.includes(m)
                            ? prev.filter((x) => x !== m)
                            : [...prev, m],
                        )
                      }
                      className={`flex min-h-16 w-full items-center gap-3 rounded-(--radius-vinheta) border-[3px] border-tinta px-4 py-3 text-left font-bold shadow-vinheta transition active:scale-95 active:shadow-none ${
                        temMaterial
                          ? "bg-turbo text-tinta"
                          : "bg-papel-claro text-tinta hover:bg-papel"
                      }`}
                    >
                      <span className="text-2xl">{emojiMaterial(m)}</span>
                      <span className="flex-1">{m}</span>
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-tinta text-sm font-bold ${
                          temMaterial ? "bg-tinta text-raio" : "bg-papel"
                        }`}
                      >
                        {temMaterial ? "✓" : ""}
                      </span>
                    </button>
                  );
                })}
              </div>

              <p className="relative text-sm font-bold text-[#EAEFFF]">
                {materiaisPlanoChecked.length} de {todosMateriaisPlano.length} prontos
              </p>
            </div>
          )}
        </div>

        <div className="bg-papel-claro px-5 pt-4 pb-6">
          <h3 className="text-xl font-display text-tinta">{ex.nome_exercicio}</h3>
          <div className="flex gap-4 mt-1 text-sm text-aco">
            <span>⏱ {formatDuration(ex.duracao_segundos)}</span>
            <span>⭐ +{ex.recompensa_xp} XP</span>
          </div>

          <div className="flex justify-center gap-2 my-4">
            {planoEmCurso.exercicios.map((_, i) => (
              <button
                key={i}
                onClick={() => todosMarcados && setPreviewIndex(i)}
                className={`h-2 rounded-full transition-all duration-200 ${
                  i === previewIndex
                    ? "w-6 bg-cobalto"
                    : i < previewIndex
                    ? "w-2 bg-cobalto/40"
                    : "w-2 bg-tinta/15"
                }`}
              />
            ))}
          </div>

          <button
            onClick={iniciarPlano}
            disabled={!todosMarcados}
            className={`w-full rounded-(--radius-vinheta) border-[3px] border-tinta py-4 text-lg font-display tracking-wide shadow-vinheta transition active:scale-95 active:shadow-none ${
              todosMarcados
                ? "bg-raio text-tinta hover:brightness-105"
                : "bg-tinta/10 text-tinta/40 cursor-not-allowed"
            }`}
          >
            Iniciar Plano ({total} exercícios) ▶
          </button>
          {todosMarcados && previewIndex < total - 1 && (
            <p className="mt-2 text-center text-xs text-aco">
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
        <div className="flex justify-center">
          <CapitaoMais className="h-24 w-auto animate-flutuar" title="" />
        </div>
        <h1 className="mt-2 text-3xl font-display tracking-tight text-tinta text-center">
          O que queres fazer hoje? 💪
        </h1>
        <p className="mt-2 text-center text-aco">Escolhe como queres treinar!</p>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          <button
            onClick={() => setView("plano-list")}
            className="entrada-pop flex flex-col items-center gap-4 rounded-(--radius-vinheta) border-[3px] border-tinta bg-cobalto/10 p-8 text-center shadow-vinheta transition hover:bg-cobalto/20 hover:-translate-y-0.5 active:scale-95"
          >
            <span className="text-6xl">📋</span>
            <div>
              <p className="text-xl font-display text-cobalto">Fazer um plano</p>
              <p className="mt-1 text-sm text-aco">Faz todos os exercícios do plano em sequência</p>
            </div>
          </button>

          <button
            onClick={() => setView("list")}
            className="entrada-pop-2 flex flex-col items-center gap-4 rounded-(--radius-vinheta) border-[3px] border-tinta bg-raio/20 p-8 text-center shadow-vinheta transition hover:bg-raio/30 hover:-translate-y-0.5 active:scale-95"
          >
            <span className="text-6xl">⚡</span>
            <div>
              <p className="text-xl font-display text-tinta">Fazer um exercício</p>
              <p className="mt-1 text-sm text-aco">Escolhe um exercício específico para fazer</p>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // ─── plano-list ────────────────────────────────────────────────────────────
  if (view === "plano-list") {
    const comExercicios = planos.filter((p) => p.exercicios.length > 0);
    const planosVisiveis =
      filtroCondicao === "Todos"
        ? comExercicios
        : comExercicios.filter(
            (p) => (p.condicao_paciente ?? "A") === filtroCondicao,
          );

    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-10">
        <button
          onClick={() => setView("escolha")}
          className="mb-6 text-sm font-medium text-aco transition hover:text-tinta"
        >
          ← Voltar
        </button>
        <h1 className="text-2xl font-display tracking-tight text-tinta">Escolhe um plano 📋</h1>
        <p className="mt-1 text-sm text-aco">Toca num plano para o ver e começar!</p>

        {/* Filtro por condição — quadrados grandes, um toque escolhe */}
        <div className="mt-5">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-aco">
            Condição
          </p>
          <div className="flex flex-wrap gap-3">
            {["Todos", "A", "B", "C"].map((op) => {
              const ativo = filtroCondicao === op;
              return (
                <button
                  key={op}
                  type="button"
                  aria-pressed={ativo}
                  onClick={() => setFiltroCondicao(op)}
                  className={`flex h-16 min-w-16 items-center justify-center rounded-(--radius-vinheta) border-[3px] border-tinta px-5 font-display text-xl tracking-wide shadow-vinheta transition active:scale-95 active:shadow-none ${
                    ativo
                      ? "bg-cobalto text-papel"
                      : "bg-papel-claro text-tinta hover:bg-papel"
                  }`}
                >
                  {op}
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <LoadingSpinner mensagem="A carregar planos de treino..." />
        ) : planosVisiveis.length === 0 ? (
          <div className="mt-8 rounded-(--radius-vinheta) border-[3px] border-tinta bg-papel-claro p-8 text-center shadow-vinheta">
            <div className="mx-auto mb-3 flex justify-center">
              <CapitaoMais className="h-20 w-auto animate-flutuar" title="" />
            </div>
            {filtroCondicao === "Todos" ? (
              <p className="text-aco">
                Ainda não há planos para ti — mas o Capitão está a preparar-te um!
              </p>
            ) : (
              <>
                <p className="text-aco">
                  Ainda não há planos da condição {filtroCondicao}.
                </p>
                <button
                  onClick={() => setFiltroCondicao("Todos")}
                  className="mt-4 rounded-(--radius-vinheta) border-[3px] border-tinta bg-cobalto px-5 py-3 font-display text-base tracking-wide text-papel shadow-vinheta transition hover:bg-cobalto-vivo active:scale-95 active:shadow-none"
                >
                  Ver todos
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {planosVisiveis
              .map((plano, idx) => {
                const exs = plano.exercicios;
                const totalSeg = exs.reduce((a, e) => a + e.duracao_segundos, 0);
                const totalXp = exs.reduce((a, e) => a + e.recompensa_xp, 0);
                const capa = exs.find((e) => e.url_video)?.url_video;
                const dif = infoDificuldade(plano.dificuldade);
                return (
                  <button
                    key={plano.id_plano}
                    onClick={() => abrirPreviewPlano(plano)}
                    className={`${cascata(idx)} group flex flex-col overflow-hidden rounded-(--radius-vinheta) border-[3px] border-tinta bg-papel-claro text-left shadow-vinheta transition hover:-translate-y-1 active:translate-y-0 active:shadow-none`}
                  >
                    {/* Capa: Capitão sempre visível; frame do vídeo entra com fade */}
                    <div className="relative">
                      <CapaPlano url={capa} />
                      <span className={`absolute left-2 top-2 rounded-full border-2 border-tinta px-2.5 py-0.5 text-xs font-bold ${dif.chip}`}>
                        {dif.label}
                      </span>
                      <span className="absolute right-2 top-2 rounded-full border-2 border-tinta bg-cobalto px-2.5 py-0.5 text-xs font-bold text-papel">
                        {exs.length} {exs.length === 1 ? "treino" : "treinos"}
                      </span>
                      {/* ícone de play grande ao centro */}
                      <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[3px] border-tinta bg-raio text-2xl text-tinta shadow-vinheta transition group-hover:scale-110">
                        ▶
                      </span>
                    </div>

                    {/* Corpo */}
                    <div className="flex flex-grow flex-col p-4">
                      <h3 className="font-display text-xl tracking-wide text-tinta">
                        Plano {dif.label}
                      </h3>
                      <p className="mt-0.5 line-clamp-1 text-xs text-aco">
                        {exs.map((e) => e.nome_exercicio).join(" · ")}
                      </p>

                      {plano.notas_medicas && (
                        <p className="mt-2 line-clamp-2 rounded-xl border border-tinta/15 bg-papel p-2 text-xs italic text-aco">
                          {plano.notas_medicas}
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                        <span className="rounded-full border border-tinta/15 bg-papel px-2.5 py-1 text-aco">
                          ⏱ {formatDuration(totalSeg)}
                        </span>
                        <span className="rounded-full border border-tinta/20 bg-raio/20 px-2.5 py-1 text-tinta">
                          ⭐ +{totalXp} XP
                        </span>
                      </div>

                      <span className="mt-4 flex items-center justify-center gap-2 rounded-(--radius-vinheta) border-[3px] border-tinta bg-cobalto py-3 font-display text-base tracking-wide text-papel shadow-vinheta transition group-hover:bg-cobalto-vivo">
                        Começar ▶
                      </span>
                    </div>
                  </button>
                );
              })}
          </div>
        )}
      </div>
    );
  }

  // ─── list: biblioteca de exercícios ────────────────────────────────────────
  return (
    <BibliotecaExercicios
      onVoltar={() => setView("escolha")}
      onSelecionarExercicio={(ex) => {
        setExercicioSelecionado(ex);
        setPlanoSelecionadoId("");
        setView("preview");
      }}
    />
  );
};

export default PlanosPaciente;