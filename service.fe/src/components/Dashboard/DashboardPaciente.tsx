import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import BtnGlobal from "../BtnGlobal";
import type { UserProfile } from "../../types/user";
import {
  planosService,
  type PlanoAtivo,
} from "../../services/planosService";

interface LayoutContext {
  user: UserProfile | null;
  handleLoginSuccess: () => void;
  handleLogout: () => void;
}

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return s === 0 ? `${m} min` : `${m} min ${s}s`;
};

const DashboardPaciente = () => {
  const navigate = useNavigate();
  const { user } = useOutletContext<LayoutContext>();
  const displayName = user?.nome?.split(" ")[0] ?? "Paciente";

  const [plano] = useState<PlanoAtivo | null>(null);
  const [loadingPlano, setLoadingPlano] = useState(true);

  useEffect(() => {
    if (!user?.idUser) return;
    planosService
      planosService.getTodosPlanosPorPaciente(user.idUser).then(({ ativo }) => ativo)
      .catch(console.error)
      .finally(() => setLoadingPlano(false));
  }, [user?.idUser]);

  const highlights = [
    {
      label: "Streak atual",
      value: `${user?.streakAtual ?? 0} dias`,
      accent: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "XP total",
      value: user?.xp?.toLocaleString("pt-PT") ?? "0",
      accent: "bg-blue-50 text-blue-700",
    },
    {
      label: "Nível",
      value: `Nível ${user?.nivel ?? 1}`,
      accent: "bg-violet-50 text-violet-700",
    },
  ];

  return (
    <div className="flex-1 bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-blue-600 to-indigo-600 p-6 text-white shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-100">
                Dashboard do Paciente
              </p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Olá, {displayName}
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-blue-100 sm:text-base">
                Aqui tens uma visão rápida do teu progresso e do teu plano de exercícios.
              </p>
            </div>
            <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur-sm">
              <p className="text-sm font-medium text-blue-50">Nível</p>
              <p className="mt-1 text-2xl font-bold">{user?.nivel ?? 1}</p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {highlights.map((item) => (
            <article
              key={item.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${item.accent}`}>
                {item.label}
              </div>
              <p className="mt-4 text-2xl font-extrabold text-slate-900">
                {item.value}
              </p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Plano ativo</h2>
                <p className="mt-1 text-sm text-slate-500">Os teus exercícios de hoje.</p>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
                Hoje
              </span>
            </div>

            <div className="mt-6">
              {loadingPlano ? (
                <p className="text-sm text-slate-400">A carregar plano...</p>
              ) : !plano ? (
                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                  Ainda não tens um plano atribuído pelo médico.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {plano.notas_medicas && (
                    <div className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-700">
                      <span className="font-semibold">Nota: </span>
                      {plano.notas_medicas}
                    </div>
                  )}
                  {plano.exercicios.slice(0, 3).map((ex) => (
                    <div
                      key={ex.id_exercicio}
                      className="flex items-center justify-between rounded-2xl bg-slate-50 p-4"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{ex.nome_exercicio}</p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {formatTime(ex.duracao_segundos)} ·{" "}
                          <span className="font-medium text-blue-600">+{ex.recompensa_xp} XP</span>
                        </p>
                      </div>
                    </div>
                  ))}
                  {plano.exercicios.length > 3 && (
                    <p className="text-center text-xs text-slate-400">
                      +{plano.exercicios.length - 3} exercícios
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <BtnGlobal
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                onClick={() => navigate("/paciente/planos")}
              >
                Ver plano completo
              </BtnGlobal>
              <BtnGlobal
                variant="secondary"
                onClick={() => navigate("/perfil")}
                className="rounded-xl border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Informação pessoal
              </BtnGlobal>
            </div>
          </article>

          <div className="space-y-4">
            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">Progresso semanal</h2>
              <p className="mt-2 text-sm text-slate-500">
                {plano
                  ? `Frequência recomendada: ${plano.frequencia_semanal}x por semana.`
                  : "O teu progresso aparece aqui quando tiveres um plano."}
              </p>
              <div className="mt-4 h-2 rounded-full bg-slate-100">
                <div className="h-2 w-1/4 rounded-full bg-blue-600" />
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-700">Mantém a regularidade!</p>
            </article>

            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">Streak 🔥</h2>
              <p className="mt-2 text-3xl font-extrabold text-emerald-600">
                {user?.streakAtual ?? 0} dias
              </p>
              <p className="mt-1 text-sm text-slate-500">Continua assim!</p>
            </article>
          </div>
        </section>
      </div>
    </div>
  );
};

export default DashboardPaciente;