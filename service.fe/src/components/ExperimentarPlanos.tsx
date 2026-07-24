import { useState, useEffect } from "react";
import {
  planosService,
  type PlanoAtivo,
  type ExercicioDoPlano,
} from "../services/planosService";
import ExercicioPlayer from "./Planos/ExercicioPlayer";
import ExercicioPreview from "./Planos/ExercicioPreview";
import LoadingSpinner from "./LoadingSpinner";
import CapitaoMais from "./CapitaoMais";

type View = "list" | "preview" | "playing";

export const ExperimentarPlanos = () => {
  const [planos, setPlanos] = useState<PlanoAtivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [view, setView] = useState<View>("list");
  const [exercicioSelecionado, setExercicioSelecionado] = useState<ExercicioDoPlano | null>(null);

  useEffect(() => {
    planosService
      .getPlanosPublicos()
      .then(setPlanos)
      .catch((e) => {
        console.error(e);
        setErro("Não foi possível carregar os planos.");
      })
      .finally(() => setLoading(false));
  }, []);

  if (view === "playing" && exercicioSelecionado) {
    return (
      <ExercicioPlayer
        exercicio={exercicioSelecionado}
        idPrescricao=""
        idPaciente=""
        modoConvidado
        onVoltar={() => setView("preview")}
        onConcluir={() => {
          setView("list");
          setExercicioSelecionado(null);
        }}
      />
    );
  }

  if (view === "preview" && exercicioSelecionado) {
    return (
      <ExercicioPreview
        exercicio={exercicioSelecionado}
        onVoltar={() => setView("list")}
        onComecar={() => setView("playing")}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <div className="flex items-center gap-3">
        <CapitaoMais className="h-14 w-auto animate-balancar" title="" />
        <div>
          <h1 className="font-display text-3xl tracking-wide text-tinta">
            Experimenta um treino MMAIS<span className="texto-raio-contorno">+</span>
          </h1>
          <p className="mt-1 text-sm text-aco">
            Sem precisares de conta — escolhe um exercício e começa já.
          </p>
        </div>
      </div>

      {loading && <LoadingSpinner mensagem="A carregar treinos..." />}
      {erro && (
        <p className="mt-8 rounded-(--radius-vinheta) border-2 border-capa bg-capa/10 p-3 text-sm font-medium text-capa-escura">
          {erro}
        </p>
      )}

      {!loading && !erro && (
        <>
          {planos.length === 0 ? (
            <div className="mt-8 rounded-(--radius-vinheta) border-[3px] border-tinta bg-papel-claro p-8 text-center shadow-vinheta">
              <div className="mx-auto mb-3 flex justify-center">
                <CapitaoMais className="h-20 w-auto animate-flutuar" title="" />
              </div>
              <p className="text-aco">
                Ainda não há treinos disponíveis para experimentar.
              </p>
            </div>
          ) : (
            // Um cartão por treino, com o mesmo desenho dos planos da
            // plataforma: capa com vídeo, chips e botão de começar.
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {planos
                .flatMap((plano) =>
                  plano.exercicios.map((ex) => ({ plano, ex })),
                )
                .map(({ plano, ex }, idx) => (
                  <button
                    key={`${plano.id_plano}-${ex.id_exercicio}`}
                    onClick={() => {
                      setExercicioSelecionado(ex);
                      setView("preview");
                    }}
                    className={`entrada-pop${["", "-2", "-3", "-4"][idx % 4]} group flex flex-col overflow-hidden rounded-(--radius-vinheta) border-[3px] border-tinta bg-papel-claro text-left shadow-vinheta transition hover:-translate-y-1 active:translate-y-0 active:shadow-none`}
                  >
                    <div className="relative h-40 w-full flex-shrink-0 overflow-hidden border-b-[3px] border-tinta bg-[linear-gradient(135deg,#3D6BFF_0%,#1D42C8_100%)]">
                      <div className="fundo-reticula absolute inset-0 opacity-40" aria-hidden="true" />
                      <div className="absolute bottom-1 left-3">
                        <CapitaoMais className="h-16 w-auto animate-flutuar" title="" />
                      </div>
                      {ex.url_video && (
                        <video
                          src={`${ex.url_video}#t=0.1`}
                          className="absolute inset-0 h-full w-full object-cover"
                          preload="metadata"
                          muted
                          playsInline
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-tinta/50 to-transparent" aria-hidden="true" />
                      <span className="absolute right-2 top-2 rounded-full border-2 border-tinta bg-raio px-2.5 py-0.5 text-xs font-bold text-tinta">
                        Grátis
                      </span>
                      <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[3px] border-tinta bg-raio text-2xl text-tinta shadow-vinheta transition group-hover:scale-110">
                        ▶
                      </span>
                    </div>

                    <div className="flex flex-grow flex-col p-4">
                      <h3 className="font-display text-xl tracking-wide text-tinta">
                        {ex.nome_exercicio}
                      </h3>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                        <span className="rounded-full border border-tinta/15 bg-papel px-2.5 py-1 text-aco">
                          ⏱ {Math.floor(ex.duracao_segundos / 60)} min
                        </span>
                        <span className="rounded-full border border-tinta/20 bg-raio/20 px-2.5 py-1 text-tinta">
                          ⭐ +{ex.recompensa_xp} XP
                        </span>
                      </div>
                      <span className="mt-4 flex items-center justify-center gap-2 rounded-(--radius-vinheta) border-[3px] border-tinta bg-cobalto py-3 font-display text-base tracking-wide text-papel shadow-vinheta transition group-hover:bg-cobalto-vivo">
                        Experimentar ▶
                      </span>
                    </div>
                  </button>
                ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ExperimentarPlanos;