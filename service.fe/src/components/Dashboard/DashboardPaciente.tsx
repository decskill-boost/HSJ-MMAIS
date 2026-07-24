import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import BtnGlobal from "../BtnGlobal";
import type { UserProfile } from "../../types/user";
import { supabase } from "../../services/supabaseClient";

interface LayoutContext {
  user: UserProfile | null;
  handleLoginSuccess: () => void;
  handleLogout: () => void;
}

const formatarDataSessao = (dataString?: string | null) => {
  if (!dataString) return "";
  return new Date(dataString).toLocaleString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

interface UltimaSessao {
  id_sessao: string;
  data_hora: string;
  duracao: number;
  esforco_1_a_10: number | null;
  status: string;
  exercicios: {
    nome_exercicio: string;
    recompensa_xp: number;
  } | null;
}

const DashboardPaciente = () => {
  const navigate = useNavigate();
  const { user } = useOutletContext<LayoutContext>();
  const displayName = user?.nome?.split(" ")[0] ?? "Paciente";

  const [ultimaSessao, setUltimaSessao] = useState<UltimaSessao | null>(null);
  const [loadingUltimaSessao, setLoadingUltimaSessao] = useState(true);

  useEffect(() => {
    const idUser = user?.idUser;
    if (!idUser) return;

    // Obter última sessão concluída
    async function carregarUltimaSessao() {
      try {
        const { data, error } = await supabase
          .from("sessoes_realizadas")
          .select(
            `
            id_sessao,
            data_hora,
            duracao,
            esforco_1_a_10,
            status,
            exercicios (
              nome_exercicio,
              recompensa_xp
            )
          `,
          )
          .eq("id_paciente", idUser)
          .eq("status", "concluido")
          .order("data_hora", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!error && data) {
          setUltimaSessao(data as unknown as UltimaSessao);
        }
      } catch (err) {
        console.error("Erro ao obter última sessão:", err);
      } finally {
        setLoadingUltimaSessao(false);
      }
    }

    void carregarUltimaSessao();
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
      accent: "bg-raio/25 text-tinta",
    },
  ];

  return (
    <div className="flex-1 bg-papel px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        {/* HERO SECTION */}
        <section className="rounded-3xl border border-tinta/15 bg-gradient-to-br from-cobalto to-cobalto p-6 text-papel shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#EAEFFF]">
                Dashboard do Paciente
              </p>
              <h1 className="mt-2 font-display text-3xl tracking-wide sm:text-4xl">
                Olá, {displayName}
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-blue-100 sm:text-base">
                Aqui tens uma visão rápida do teu progresso e das tuas
                atividades.
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
          {/* COLUNA ESQUERDA: ATIVIDADE RECENTE */}
          <article className="flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            {/* Cabeçalho */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Atividade recente
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  O teu último treino concluído.
                </p>
              </div>
              <span className="rounded-full bg-cobalto/10 px-3 py-1 text-sm font-semibold text-cobalto-vivo">
                Hoje
              </span>
            </div>

            {/* Conteúdo */}
            <div>
              {loadingUltimaSessao ? (
                <p className="text-sm text-slate-400">
                  A carregar última atividade...
                </p>
              ) : ultimaSessao ? (
                <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-bold text-slate-900">
                        {ultimaSessao.exercicios?.nome_exercicio ??
                          "Exercício Geral"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatarDataSessao(ultimaSessao.data_hora)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                        +{ultimaSessao.exercicios?.recompensa_xp ?? 10} XP
                      </span>
                      {ultimaSessao.esforco_1_a_10 !== null && (
                        <p className="mt-1 text-xs text-slate-500">
                          Esforço: {ultimaSessao.esforco_1_a_10}/10
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">
                  Ainda não realizaste nenhum exercício de treino. Clica em "Ver
                  planos" para começar! 💪
                </div>
              )}
            </div>

            {/* Ações */}
            <div className="flex flex-col gap-3 border-t border-tinta/10 pt-6 sm:flex-row">
              <BtnGlobal
                className="flex w-full flex-1 justify-center rounded-xl bg-cobalto px-5 py-3 text-sm font-semibold text-papel shadow-sm hover:bg-cobalto-vivo sm:w-auto"
                onClick={() => navigate("/paciente/planos")}
              >
                Ver planos
              </BtnGlobal>
              <BtnGlobal
                variant="secondary"
                onClick={() => navigate("/paciente/historico")}
                className="flex w-full flex-1 justify-center rounded-xl border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:w-auto"
              >
                Ver histórico
              </BtnGlobal>
            </div>
          </article>

          {/* COLUNA DIREITA: PROGRESSO E STREAK */}
          <div className="flex flex-col gap-6">
            <article className="rounded-3xl border border-tinta/15 bg-papel-claro p-6 shadow-sm">
              <h2 className="text-lg font-bold text-tinta">
                Progresso semanal
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Continua a fazer os teus exercícios para manter o teu corpo
                ativo!
              </p>
              <div className="mt-4 h-2 rounded-full bg-slate-100">
                <div className="h-2 w-1/2 rounded-full bg-blue-600" />
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
