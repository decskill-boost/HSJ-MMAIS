import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import type { UserProfile } from "../../types/user";
import { supabase } from "../../services/supabaseClient";
import CapitaoMais from "../CapitaoMais";

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
  const displayName = user?.nome?.split(" ")[0] ?? "Herói";

  const [ultimaSessao, setUltimaSessao] = useState<UltimaSessao | null>(null);
  const [loadingUltimaSessao, setLoadingUltimaSessao] = useState(true);

  useEffect(() => {
    const idUser = user?.idUser;
    if (!idUser) return;

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

  // Medalhas do herói
  const medalhas = [
    {
      emoji: "🔥",
      label: "Dias seguidos",
      value: `${user?.streakAtual ?? 0}`,
      fundo: "bg-turbo/15",
    },
    {
      emoji: "⭐",
      label: "XP total",
      value: user?.xp?.toLocaleString("pt-PT") ?? "0",
      fundo: "bg-raio/25",
    },
    {
      emoji: "🏅",
      label: "Nível",
      value: `${user?.nivel ?? 1}`,
      fundo: "bg-cobalto/10",
    },
  ];

  return (
    <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        {/* HERO — boas-vindas do herói */}
        <section className="relative overflow-hidden rounded-(--radius-vinheta) border-[3px] border-tinta bg-[linear-gradient(135deg,#3D6BFF_0%,#1D42C8_100%)] p-6 text-papel shadow-vinheta sm:p-8">
          <div className="fundo-reticula absolute inset-0 opacity-40" aria-hidden="true" />
          <div className="relative flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
            <CapitaoMais className="h-24 w-auto animate-flutuar" title="" />
            <div className="flex-1">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#EAEFFF]">
                Herói em treino
              </p>
              <h1 className="mt-1 font-display text-3xl tracking-wide sm:text-4xl">
                Olá, {displayName}! 🦸
              </h1>
              <p className="mt-2 text-sm text-[#F0F3FF]">
                Pronto para mais uma missão? Cada treino são superpoderes novos.
              </p>
            </div>
          </div>

          {/* CTA principal */}
          <button
            onClick={() => navigate("/paciente/planos")}
            className="relative mt-5 flex w-full items-center justify-center gap-2 rounded-(--radius-vinheta) border-[3px] border-tinta bg-raio py-4 font-display text-xl tracking-wide text-tinta shadow-vinheta transition hover:brightness-105 active:scale-[0.98] active:shadow-none"
          >
            Começar treino de hoje ▶
          </button>
        </section>

        {/* MEDALHAS */}
        <section className="grid grid-cols-3 gap-3 sm:gap-4">
          {medalhas.map((m, i) => (
            <article
              key={m.label}
              className={`${["entrada-pop", "entrada-pop-2", "entrada-pop-3"][i]} flex flex-col items-center gap-1 rounded-(--radius-vinheta) border-[3px] border-tinta ${m.fundo} p-4 text-center shadow-vinheta`}
            >
              <span className="text-3xl">{m.emoji}</span>
              <p className="font-display text-2xl tracking-wide text-tinta sm:text-3xl">
                {m.value}
              </p>
              <p className="text-[11px] font-bold uppercase tracking-wide text-aco sm:text-xs">
                {m.label}
              </p>
            </article>
          ))}
        </section>

        {/* ÚLTIMA CONQUISTA + ATALHOS */}
        <section className="grid items-start gap-6 lg:grid-cols-[1.4fr_0.6fr]">
          <article className="rounded-(--radius-vinheta) border-[3px] border-tinta bg-papel-claro p-6 shadow-vinheta">
            <h2 className="font-display text-xl tracking-wide text-tinta">
              A tua última conquista 🏆
            </h2>

            {loadingUltimaSessao ? (
              <p className="mt-4 text-sm text-aco">A carregar…</p>
            ) : ultimaSessao ? (
              <div className="mt-4 flex items-center justify-between gap-4 rounded-2xl border-2 border-tinta/15 bg-papel p-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🏅</span>
                  <div>
                    <p className="font-bold text-tinta">
                      {ultimaSessao.exercicios?.nome_exercicio ?? "Treino"}
                    </p>
                    <p className="mt-0.5 text-xs text-aco">
                      {formatarDataSessao(ultimaSessao.data_hora)}
                    </p>
                  </div>
                </div>
                <span className="shrink-0 rounded-full border-2 border-tinta bg-raio px-3 py-1 text-sm font-bold text-tinta">
                  +{ultimaSessao.exercicios?.recompensa_xp ?? 10} XP
                </span>
              </div>
            ) : (
              <div className="mt-4 flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-tinta/25 p-6 text-center">
                <CapitaoMais className="h-16 w-auto animate-flutuar" title="" />
                <p className="text-sm text-aco">
                  Ainda não fizeste nenhum treino. A tua primeira medalha está à
                  espera! 💪
                </p>
              </div>
            )}
          </article>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate("/paciente/planos")}
              className="flex items-center gap-3 rounded-(--radius-vinheta) border-[3px] border-tinta bg-cobalto p-4 text-left font-bold text-papel shadow-vinheta transition hover:bg-cobalto-vivo active:scale-95 active:shadow-none"
            >
              <span className="text-2xl">📋</span> Ver os meus planos
            </button>
            <button
              onClick={() => navigate("/paciente/historico")}
              className="flex items-center gap-3 rounded-(--radius-vinheta) border-[3px] border-tinta bg-papel-claro p-4 text-left font-bold text-tinta shadow-vinheta transition hover:bg-papel active:scale-95 active:shadow-none"
            >
              <span className="text-2xl">🏆</span> Histórico &amp; prémios
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default DashboardPaciente;
