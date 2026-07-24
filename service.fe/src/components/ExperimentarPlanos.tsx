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
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              {planos.map((plano, idx) => (
                <div
                  key={plano.id_plano}
                  className={`entrada-pop${idx > 0 ? `-${Math.min(idx + 1, 4)}` : ""} rounded-(--radius-vinheta) border-[3px] border-tinta bg-papel-claro p-5 shadow-vinheta`}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wide text-cobalto">
                      Intensidade: Nível {plano.dificuldade}
                    </span>
                    <span className="rounded-full border-2 border-tinta bg-raio px-3 py-0.5 text-xs font-bold text-tinta">
                      Base
                    </span>
                  </div>

                  {plano.notas_medicas && (
                    <p className="mb-3 rounded-xl border border-tinta/15 bg-papel p-2.5 text-xs italic text-aco">
                      {plano.notas_medicas}
                    </p>
                  )}

                  <div className="space-y-2">
                    {plano.exercicios.map((ex) => (
                      <button
                        key={ex.id_exercicio}
                        onClick={() => {
                          setExercicioSelecionado(ex);
                          setView("preview");
                        }}
                        className="flex w-full items-center justify-between gap-3 rounded-xl border-2 border-tinta/15 bg-papel p-3 text-left text-xs font-semibold text-tinta transition hover:border-cobalto hover:bg-cobalto/5 active:scale-[0.99]"
                      >
                        <div>
                          <p className="font-bold text-tinta">{ex.nome_exercicio}</p>
                          <p className="mt-0.5 text-[10px] font-medium text-aco">
                            ⏱ {Math.floor(ex.duracao_segundos / 60)} min
                          </p>
                        </div>
                        <span className="text-sm font-bold text-cobalto">
                          Experimentar →
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ExperimentarPlanos;