import { useState, useEffect } from "react";
import {
  planosService,
  type PlanoAtivo,
  type ExercicioDoPlano,
} from "../services/planosService";
import ExercicioPlayer from "./Planos/ExercicioPlayer";
import ExercicioPreview from "./Planos/ExercicioPreview";

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
      <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
        Experimenta um plano +MMAis
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Sem precisares de conta — escolhe um exercício e experimenta agora.
      </p>

      {loading && <p className="mt-10 text-sm text-slate-400">A carregar planos…</p>}
      {erro && (
        <p className="mt-8 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-700">{erro}</p>
      )}

      {!loading && !erro && (
        <>
          {planos.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-center">
              <p className="text-slate-500">Ainda não há planos disponíveis para experimentar.</p>
            </div>
          ) : (
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              {planos.map((plano) => (
                <div key={plano.id_plano} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wide text-indigo-600">
                      Intensidade: Nível {plano.dificuldade}
                    </span>
                    <span className="rounded-full bg-blue-100 px-3 py-0.5 text-xs font-semibold text-blue-700">
                      Standard
                    </span>
                  </div>

                  {plano.notas_medicas && (
                    <p className="mb-3 rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-xs italic text-slate-600">
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
                        className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 text-left text-xs font-semibold text-slate-700 transition hover:bg-slate-100/80"
                      >
                        <div>
                          <p className="font-bold text-slate-800">{ex.nome_exercicio}</p>
                          <p className="mt-0.5 text-[10px] font-medium text-slate-400">
                            ⏱ {Math.floor(ex.duracao_segundos / 60)} min
                          </p>
                        </div>
                        <span className="text-sm font-bold text-indigo-600">Experimentar →</span>
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