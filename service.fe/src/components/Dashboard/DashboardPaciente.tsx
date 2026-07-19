import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import BtnGlobal from "../BtnGlobal";
import type { UserProfile } from "../../types/user";
import { planosService, type PlanoAtivo } from "../../services/planosService";

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

  const [plano, setPlano] = useState<PlanoAtivo | null>(null);
  const [loadingPlano, setLoadingPlano] = useState(true);

  useEffect(() => {
    if (!user?.idUser) return;
    planosService
      .getTodosPlanosPorPaciente(user.idUser)
      .then(({ ativo }) => setPlano(ativo))
      .catch(console.error)
      .finally(() => setLoadingPlano(false));
  }, [user?.idUser]);

  const highlights = [
    {
      label: "Streak atual",
      value: `${user?.streakAtual ?? 0} dias`,
      accent: "bg-turbo/10 text-turbo-escuro",
    },
    {
      label: "XP total",
      value: user?.xp?.toLocaleString("pt-PT") ?? "0",
      accent: "bg-cobalto/10 text-cobalto-vivo",
    },
    {
      label: "Nível",
      value: `Nível ${user?.nivel ?? 1}`,
      accent: "bg-violet-50 text-violet-700",
    },
  ];

  return (
    <div className="flex-1 bg-papel px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        {/* HERO SECTION */}
        <section className="rounded-3xl border border-tinta/15 bg-gradient-to-br from-cobalto to-cobalto p-6 text-papel shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cobalto/15">
                Dashboard do Paciente
              </p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Olá, {displayName}
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-cobalto/15 sm:text-base">
                Aqui tens uma visão rápida do teu progresso e do teu plano de
                exercícios.
              </p>
            </div>
            <div className="rounded-2xl bg-papel-claro/15 px-4 py-3 backdrop-blur-sm">
              <p className="text-sm font-medium text-cobalto/10">Nível</p>
              <p className="mt-1 text-2xl font-bold">{user?.nivel ?? 1}</p>
            </div>
          </div>
        </section>

        {/* MÉTRICAS (HIGHLIGHTS) */}
        <section className="grid gap-4 md:grid-cols-3">
          {highlights.map((item) => (
            <article
              key={item.label}
              className="rounded-2xl border border-tinta/15 bg-papel-claro p-5 shadow-sm"
            >
              <div
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${item.accent}`}
              >
                {item.label}
              </div>
              <p className="mt-4 text-2xl font-extrabold text-tinta">
                {item.value}
              </p>
            </article>
          ))}
        </section>

        {/* GRELHA PRINCIPAL (PLANO ATIVO + PROGRESSO) */}
        <section className="grid items-start gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          {/* COLUNA ESQUERDA: PLANO ATIVO */}
          <article className="flex flex-col gap-6 rounded-3xl border border-tinta/15 bg-papel-claro p-6 shadow-sm sm:p-8">
            {/* Cabeçalho */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-tinta">
                  Plano ativo
                </h2>
                <p className="mt-1 text-sm text-aco">
                  Os teus exercícios de hoje.
                </p>
              </div>
              <span className="rounded-full bg-cobalto/10 px-3 py-1 text-sm font-semibold text-cobalto-vivo">
                Hoje
              </span>
            </div>

            {/* Conteúdo */}
            <div>
              {loadingPlano ? (
                <p className="text-sm text-aco">A carregar plano...</p>
              ) : !plano ? (
                <div className="rounded-2xl border border-tinta/10 bg-papel p-6 text-center text-sm text-aco">
                  Ainda não tens um plano atribuído pelo teu médico.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {plano.notas_medicas && (
                    <div className="mb-2 rounded-xl border border-cobalto/15 bg-cobalto/10/50 p-4 text-sm text-cobalto">
                      <span className="font-semibold">Nota: </span>
                      {plano.notas_medicas}
                    </div>
                  )}

                  {plano.exercicios.slice(0, 3).map((ex) => (
                    <div
                      key={ex.id_exercicio}
                      className="flex items-center justify-between rounded-2xl border border-tinta/10 bg-papel p-4 transition hover:bg-tinta/10/80"
                    >
                      <div>
                        <p className="font-semibold text-tinta">
                          {ex.nome_exercicio}
                        </p>
                        <div className="mt-1 flex items-center gap-2 text-xs text-aco">
                          <span>{formatTime(ex.duracao_segundos)}</span>
                          <span className="text-tinta/20">·</span>
                          <span className="font-medium text-cobalto">
                            +{ex.recompensa_xp} XP
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {plano.exercicios.length > 3 && (
                    <p className="mt-2 text-center text-sm font-medium text-aco">
                      + {plano.exercicios.length - 3} exercícios
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Ações */}
            <div className="flex flex-col gap-3 border-t border-tinta/10 pt-6 sm:flex-row">
              <BtnGlobal
                className="flex w-full flex-1 justify-center rounded-xl bg-cobalto px-5 py-3 text-sm font-semibold text-papel shadow-sm hover:bg-cobalto-vivo sm:w-auto"
                onClick={() => navigate("/paciente/planos")}
              >
                Ver plano completo
              </BtnGlobal>
              <BtnGlobal
                variant="secondary"
                onClick={() => navigate("/perfil")}
                className="flex w-full justify-center rounded-xl border-tinta/15 px-5 py-3 text-sm font-semibold text-tinta hover:bg-papel sm:w-auto"
              >
                Informação pessoal
              </BtnGlobal>
            </div>
          </article>

          {/* COLUNA DIREITA: PROGRESSO E STREAK */}
          <div className="flex flex-col gap-6">
            <article className="rounded-3xl border border-tinta/15 bg-papel-claro p-6 shadow-sm">
              <h2 className="text-lg font-bold text-tinta">
                Progresso semanal
              </h2>
              <p className="mt-2 text-sm text-aco">
                {plano
                  ? `Frequência recomendada: ${plano.frequencia_semanal}x por semana.`
                  : "O teu progresso aparece aqui quando tiveres um plano."}
              </p>
              <div className="mt-4 h-2 rounded-full bg-tinta/10">
                <div className="h-2 w-1/4 rounded-full bg-cobalto" />
              </div>
              <p className="mt-2 text-sm font-semibold text-tinta">
                Mantém a regularidade!
              </p>
            </article>

            <article className="rounded-3xl border border-tinta/15 bg-papel-claro p-6 shadow-sm">
              <h2 className="text-lg font-bold text-tinta">Streak 🔥</h2>
              <p className="mt-2 text-3xl font-extrabold text-turbo-escuro">
                {user?.streakAtual ?? 0} dias
              </p>
              <p className="mt-1 text-sm text-aco">Continua assim!</p>
            </article>
          </div>
        </section>
      </div>
    </div>
  );
};

export default DashboardPaciente;
