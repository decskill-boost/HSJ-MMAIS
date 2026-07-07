import { useNavigate, useOutletContext } from "react-router-dom";
import BtnGlobal from "../BtnGlobal";
import type { UserProfile } from "../../types/user";

interface LayoutContext {
  user: UserProfile | null;
  handleLogin: (userProfile: UserProfile) => boolean;
  handleLogout: () => void;
}

const patients = [
  {
    name: "João Silva",
    age: 10,
    prescription:
      "Circuito de brincadeiras ativas 3x/semana + alongamentos divertidos",
  },
  {
    name: "Marta Sousa",
    age: 14,
    prescription:
      "Treino de coordenação e salto 2x/semana + jogos de equilíbrio",
  },
  {
    name: "Pedro Lopes",
    age: 17,
    prescription: "Sessões de mobilidade e resistência leve 3x/semana",
  },
];

const DashboardCorpoClinico = () => {
  const navigate = useNavigate();
  const { user } = useOutletContext<LayoutContext>();
  const displayName = user?.nome?.split(" ")[0] ?? "Colega";

  return (
    <div className="flex-1 bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-indigo-600 to-slate-900 p-6 text-white shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-200">
                Painel do Corpo Clínico
              </p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Olá, Dr. {displayName}
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-indigo-100 sm:text-base">
                Prescreva programas de exercício para crianças e jovens dos 6
                aos 18 anos, reveja protocolos e acompanhe o progresso diário.
              </p>
            </div>
            <div className="flex flex-col gap-3 rounded-3xl bg-white/10 px-4 py-4 text-right backdrop-blur-sm">
              <div>
                <p className="text-sm font-medium text-indigo-100">
                  Pacientes ativos
                </p>
                <p className="mt-1 text-2xl font-bold">26</p>
              </div>
              <BtnGlobal
                variant="secondary"
                onClick={() => navigate("/perfil")}
                className="rounded-xl border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Informação pessoal
              </BtnGlobal>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
              Prescrições ativas
            </p>
            <p className="mt-4 text-3xl font-bold text-slate-900">18</p>
            <p className="mt-2 text-sm text-slate-500">
              Programas de exercício atualmente atribuídos.
            </p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
              Sessões marcadas
            </p>
            <p className="mt-4 text-3xl font-bold text-slate-900">8</p>
            <p className="mt-2 text-sm text-slate-500">
              Consultas e revisões agendadas para hoje.
            </p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            {/* CORRIGIDO: Termo adequado para ambiente hospitalar do SNS */}
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
              Pacientes prioritários
            </p>
            <p className="mt-4 text-3xl font-bold text-slate-900">4</p>
            <p className="mt-2 text-sm text-slate-500">
              Crianças ou jovens que necessitam de revisão urgente.
            </p>
          </article>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Pacientes com prescrição
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Reveja e atualize os programas de exercício.
                </p>
              </div>
              <BtnGlobal
                onClick={() => navigate("/dashboard/medico/adesao")}
                className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
              >
                Ver todos os pacientes
              </BtnGlobal>
            </div>

            <div className="mt-6 space-y-4">
              {patients.map((patient) => (
                <div
                  key={patient.name}
                  className="rounded-3xl border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {patient.name}
                      </p>
                      <p className="text-sm text-slate-500">
                        {patient.age} anos
                      </p>
                    </div>
                    <BtnGlobal
                      variant="secondary"
                      className="rounded-xl border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Editar prescrição
                    </BtnGlobal>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">
                    {patient.prescription}
                  </p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Notas rápidas
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Ações de acompanhamento para o dia.
                </p>
              </div>
              <BtnGlobal className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800">
                Nova nota
              </BtnGlobal>
            </div>
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">
                  Agenda de consulta
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Preparar o plano de treino antes da sessão das 15h.
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">
                  Revisão de objetivos
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Confirmar progresso de força e mobilidade na enfermaria.
                </p>
              </div>
            </div>
          </article>
        </section>
      </div>
    </div>
  );
};

export default DashboardCorpoClinico;
