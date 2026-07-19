import { useState, useEffect } from "react";
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

type View = "list" | "preview" | "playing";

export const PlanosPaciente = () => {
  const { user } = useOutletContext<LayoutContext>();
  const [planos, setPlanos] = useState<PlanoAtivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("list");
  const [exercicioSelecionado, setExercicioSelecionado] = useState<ExercicioDoPlano | null>(null);
  const [planoSelecionadoId, setPlanoSelecionadoId] = useState<string>("");

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

  if (view === "playing" && exercicioSelecionado) return (
    <ExercicioPlayer
      exercicio={exercicioSelecionado}
      idPrescricao={planoSelecionadoId}
      idPaciente={user?.idUser ?? ""}
      onVoltar={() => setView("preview")}
      onConcluir={() => {
        setView("list");
        setExercicioSelecionado(null);
        setPlanoSelecionadoId("");
      }}
    />
  );

  if (view === "preview" && exercicioSelecionado) return (
    <ExercicioPreview
      exercicio={exercicioSelecionado}
      onVoltar={() => setView("list")}
      onComecar={() => setView("playing")}
    />
  );

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-extrabold tracking-tight text-tinta">
        Os meus planos de treino
      </h1>
      <p className="mt-1 text-sm text-aco">
        Escolhe um plano e começa a praticar!
      </p>

      {loading ? (
        <p className="mt-10 text-sm text-aco">A carregar planos de treino...</p>
      ) : planos.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-tinta/15 bg-papel-claro p-8 text-center">
          <p className="text-aco">Ainda não existem planos disponíveis.</p>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {planos.map((plano) => (
            <div key={plano.id_plano} className="rounded-2xl border border-tinta/15 bg-papel-claro p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-cobalto uppercase tracking-wide">
                  Intensidade: Nível {plano.dificuldade}
                </span>
                <span className={`rounded-full px-3 py-0.5 text-xs font-semibold ${
                  plano.is_standard !== false
                    ? "bg-cobalto/15 text-cobalto-vivo"
                    : "bg-purple-100 text-purple-700"
                }`}>
                  {plano.is_standard !== false ? "Standard" : plano.condicao_clinica || "Personalizado"}
                </span>
              </div>

              {plano.notas_medicas ? (
                <p className="text-xs text-aco italic mb-3 bg-papel p-2.5 rounded-xl border border-tinta/10">
                  {plano.notas_medicas}
                </p>
              ) : null}

              <div className="space-y-2">
                {plano.exercicios.map((ex) => (
                  <button
                    key={ex.id_exercicio}
                    onClick={() => {
                      setExercicioSelecionado(ex);
                      setPlanoSelecionadoId(plano.id_plano);
                      setView("preview");
                    }}
                    className="w-full flex items-center justify-between gap-3 rounded-xl border border-tinta/10 bg-papel hover:bg-tinta/10/80 p-3 text-left transition text-xs font-semibold text-tinta"
                  >
                    <div>
                      <p className="font-bold text-tinta">{ex.nome_exercicio}</p>
                      <p className="text-[10px] text-aco font-medium mt-0.5">
                        ⏱ {Math.floor(ex.duracao_segundos / 60)} min · +{ex.recompensa_xp} XP
                      </p>
                    </div>
                    <span className="text-cobalto text-sm font-bold">Começar →</span>
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