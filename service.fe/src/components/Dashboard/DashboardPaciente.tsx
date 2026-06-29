import { useNavigate, useOutletContext } from "react-router-dom";
import BtnGlobal from "../BtnGlobal";
import type { UserProfile } from "../../types/user";

interface LayoutContext {
  user: UserProfile | null;
  handleLoginSuccess: () => void;
  handleLogout: () => void;
}

const highlights = [
  {
    label: "Streak atual",
    value: "7 dias",
    accent: "bg-emerald-50 text-emerald-700",
  },
  {
    label: "XP total",
    value: "1.240",
    accent: "bg-blue-50 text-blue-700",
  },
  {
    label: "Meta diária",
    value: "75%",
    accent: "bg-violet-50 text-violet-700",
  },
];

const suggestedActivities = [
  "10 min de mobilidade",
  "Caminhada leve ao final do dia",
  "Exercícios respiratórios",
];

const DashboardPaciente = () => {
  const navigate = useNavigate();
  const { user } = useOutletContext<LayoutContext>();
  const displayName = user?.nome?.split(" ")[0] ?? "Paciente";

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
                Aqui tens uma visão rápida do teu progresso, das próximas ações
                e das metas para esta semana.
              </p>
            </div>

            <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur-sm">
              <p className="text-sm font-medium text-blue-50">Meta diária</p>
              <p className="mt-1 text-2xl font-bold">75%</p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {highlights.map((item) => (
            <article
              key={item.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${item.accent}`}
              >
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
                <h2 className="text-xl font-bold text-slate-900">
                  Próximo passo
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Mantém a rotina para continuares a progredir.
                </p>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
                Hoje
              </span>
            </div>

            <div className="mt-6 rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Sessão de mobilidade
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    10 minutos · 3 exercícios
                  </p>
                </div>
                <div className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-700 shadow-sm">
                  20 min
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <BtnGlobal className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
                Continuar
              </BtnGlobal>
              <BtnGlobal
                variant="secondary"
                className="rounded-xl border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Ver histórico
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
              <h2 className="text-lg font-bold text-slate-900">
                Atividades sugeridas
              </h2>
              <ul className="mt-4 space-y-3">
                {suggestedActivities.map((activity) => (
                  <li
                    key={activity}
                    className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-3 text-sm text-slate-600"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                      ✓
                    </span>
                    {activity}
                  </li>
                ))}
              </ul>
            </article>

            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">
                Acompanhamento
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                O teu progresso está a melhorar semana após semana.
              </p>
              <div className="mt-4 h-2 rounded-full bg-slate-100">
                <div className="h-2 w-3/4 rounded-full bg-blue-600" />
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-700">
                4 de 5 objetivos concluídos
              </p>
            </article>
          </div>
        </section>
      </div>
    </div>
  );
};

export default DashboardPaciente;
