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
import PlanoList from "./Planos/PlanoList";

interface LayoutContext {
  user: UserProfile | null;
}

type View = "list" | "preview" | "playing";

export const PlanosPaciente = () => {
  const { user } = useOutletContext<LayoutContext>();
  const [planoAtivo, setPlanoAtivo] = useState<PlanoAtivo | null>(null);
  const [historico, setHistorico] = useState<PlanoAtivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("list");
  const [exercicioSelecionado, setExercicioSelecionado] = useState<ExercicioDoPlano | null>(null);

  useEffect(() => {
    if (!user?.idUser) return;
    planosService
      .getTodosPlanosPorPaciente(user.idUser)
      .then(({ ativo, historico }) => {
        setPlanoAtivo(ativo);
        setHistorico(historico);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user?.idUser]);

  if (view === "playing" && exercicioSelecionado) return (
    <ExercicioPlayer
      exercicio={exercicioSelecionado}
      idPrescricao={planoAtivo?.id_plano ?? ""}
      idPaciente={user?.idUser ?? ""}
      onVoltar={() => setView("preview")}
      onConcluir={() => { setView("list"); setExercicioSelecionado(null); }}
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
      <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
        Os meus planos
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Aqui estão os teus planos de exercícios.
      </p>
      <PlanoList
        planoAtivo={planoAtivo}
        historico={historico}
        loading={loading}
        onSelecionarExercicio={(ex) => {
          setExercicioSelecionado(ex);
          setView("preview");
        }}
      />
    </div>
  );
};

export default PlanosPaciente;