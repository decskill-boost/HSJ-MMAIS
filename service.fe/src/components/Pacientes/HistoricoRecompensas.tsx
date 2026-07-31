import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { apiClient } from "../../services/apiClient";
import { mensagemDeErro } from "../../services/erroApi";
import {
  sessoesService,
  type SessaoHistorico,
} from "../../services/sessoesService";
import type { UserProfile } from "../../types/user";
import CapitaoMais from "../CapitaoMais";
import LoadingSpinner from "../LoadingSpinner";

interface LayoutContext {
  user: UserProfile | null;
}

interface Recompensa {
  id_recompensa: string;
  nome: string;
  descricao: string;
  xp_necessario: number;
  icone: string;
}

const formatDuracao = (segundos: number) => {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  if (m === 0) return `${s}s`;
  return s === 0 ? `${m} min` : `${m} min ${s}s`;
};

const formatData = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" });
};

const HistoricoRecompensas = () => {
  const { user } = useOutletContext<LayoutContext>();
  const [tab, setTab] = useState<"historico" | "recompensas">("historico");
  const [sessoes, setSessoes] = useState<SessaoHistorico[]>([]);
  const [recompensas, setRecompensas] = useState<Recompensa[]>([]);
  const [xpTotal, setXpTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.idUser) return;

    const fetchTudo = async () => {
      try {
        setErro(null);
        // O XP e o catálogo de conquistas vêm num só pedido, e o id vem do
        // token: ninguém consegue pedir o progresso de outra criança.
        const [historicoData, progresso] = await Promise.all([
          sessoesService.getHistorico(user.idUser),
          apiClient
            .get<{ xp: number; recompensas: Recompensa[] }>(
              "/users/me/progresso",
            )
            .then((resposta) => resposta.data),
        ]);

        // Reservas defensivas: uma resposta 200 com corpo inesperado (um proxy
        // pelo meio, o fallback da SPA a devolver HTML) punha
        // `recompensas.find()` a rebentar em pleno render — ecrã branco para a
        // criança, e não a mensagem de erro preparada mais abaixo, porque o
        // `catch` do pedido já não apanha um erro que acontece na renderização.
        setSessoes(Array.isArray(historicoData) ? historicoData : []);
        setRecompensas(
          Array.isArray(progresso?.recompensas) ? progresso.recompensas : [],
        );
        setXpTotal(typeof progresso?.xp === "number" ? progresso.xp : 0);
      } catch (err) {
        // O axios lança onde o supabase-js devolvia { data, error }: sem isto
        // uma leitura falhada mostrava «0 XP» a uma criança que tem XP.
        console.error(err);
        setErro(
          mensagemDeErro(
            err,
            "Não foi possível carregar o teu progresso. Verifica a ligação e tenta outra vez daqui a pouco.",
          ),
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTudo();
  }, [user?.idUser]);

  const xpParaProxima = recompensas.find((r) => r.xp_necessario > xpTotal);
  const progressoPercent = xpParaProxima
    ? Math.min(100, Math.round((xpTotal / xpParaProxima.xp_necessario) * 100))
    : 100;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <div className="mb-6">
        <h1 className="font-display text-3xl tracking-wide text-tinta">
          O meu progresso
        </h1>

        {/* Sem isto, uma consulta falhada mostrava «0 XP» e todas as conquistas
            bloqueadas a uma criança que pode ter centenas de XP. */}
        {erro && (
          <p
            role="alert"
            className="painel mt-4 border-capa bg-capa/10 p-4 text-sm font-bold text-capa-escura"
          >
            {erro}
          </p>
        )}

        {/* XP total */}
        <div className="mt-4 overflow-hidden rounded-(--radius-vinheta) border-[3px] border-tinta bg-[linear-gradient(135deg,#3D6BFF_0%,#1D42C8_100%)] p-5 text-papel shadow-vinheta">
          <p className="text-sm font-semibold uppercase tracking-widest text-[#EAEFFF]">
            XP Total
          </p>
          <p className="font-display text-5xl tracking-wide text-raio [text-shadow:2px_2px_0_#141F3C]">
            {xpTotal} XP ⭐
          </p>
          {xpParaProxima && (
            <div className="mt-3">
              <div className="mb-1 flex justify-between text-xs text-[#EAEFFF]">
                <span>Próxima conquista: {xpParaProxima.nome}</span>
                <span>{progressoPercent}%</span>
              </div>
              <div className="h-3 w-full rounded-full border-2 border-tinta bg-tinta/30">
                <div
                  className="h-full rounded-full bg-raio transition-all"
                  style={{ width: `${progressoPercent}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-[#EAEFFF]">
                Faltam {xpParaProxima.xp_necessario - xpTotal} XP
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setTab("historico")}
          className={`rounded-(--radius-vinheta) border-[3px] border-tinta px-5 py-2.5 text-sm font-bold transition active:scale-95 ${
            tab === "historico"
              ? "bg-cobalto text-papel shadow-vinheta"
              : "bg-papel-claro text-tinta hover:bg-papel"
          }`}
        >
          📋 Histórico
        </button>
        <button
          onClick={() => setTab("recompensas")}
          className={`rounded-(--radius-vinheta) border-[3px] border-tinta px-5 py-2.5 text-sm font-bold transition active:scale-95 ${
            tab === "recompensas"
              ? "bg-cobalto text-papel shadow-vinheta"
              : "bg-papel-claro text-tinta hover:bg-papel"
          }`}
        >
          🏆 Conquistas
        </button>
      </div>

      {loading ? (
        <LoadingSpinner mensagem="A carregar o teu progresso..." />
      ) : tab === "historico" ? (
        sessoes.length === 0 ? (
          <div className="rounded-(--radius-vinheta) border-[3px] border-tinta bg-papel-claro p-8 text-center shadow-vinheta">
            <div className="mx-auto mb-3 flex justify-center">
              <CapitaoMais className="h-20 w-auto animate-flutuar" title="" />
            </div>
            <p className="font-bold text-tinta">Ainda não fizeste nenhum treino!</p>
            <p className="mt-1 text-sm text-aco">
              Começa um plano e as tuas conquistas aparecem aqui.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {sessoes.map((s, idx) => (
              <div
                key={s.id_sessao}
                className={`entrada-pop${idx > 0 ? `-${Math.min(idx + 1, 4)}` : ""} flex items-center justify-between gap-4 rounded-(--radius-vinheta) border-[3px] border-tinta bg-papel-claro p-4 shadow-vinheta`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🏅</span>
                  <div>
                    <p className="text-sm font-bold text-tinta">
                      {s.exercicios?.nome_exercicio ?? "Exercício"}
                    </p>
                    <p className="text-xs text-aco">
                      {formatData(s.data_hora)} · {formatDuracao(s.duracao ?? 0)}
                    </p>
                  </div>
                </div>
                <span className="shrink-0 rounded-full border-2 border-tinta bg-raio px-3 py-1 text-sm font-bold text-tinta">
                  +{s.exercicios?.recompensa_xp ?? 0} XP
                </span>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="flex flex-col gap-3">
          {recompensas.map((r) => {
            const desbloqueada = xpTotal >= r.xp_necessario;
            return (
              <div
                key={r.id_recompensa}
                className={`flex items-center justify-between gap-4 rounded-(--radius-vinheta) border-[3px] p-4 transition ${
                  desbloqueada
                    ? "border-tinta bg-[linear-gradient(135deg,#FFCE29_0%,#FFB800_100%)] shadow-vinheta"
                    : "border-tinta/25 bg-papel-claro opacity-70"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{desbloqueada ? r.icone : "🔒"}</span>
                  <div>
                    <p className="text-sm font-bold text-tinta">{r.nome}</p>
                    <p className={`text-xs ${desbloqueada ? "text-tinta/80" : "text-aco"}`}>
                      {r.descricao}
                    </p>
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-full border-2 border-tinta px-3 py-1 text-sm font-bold ${
                    desbloqueada ? "bg-papel-claro text-tinta" : "bg-papel text-aco"
                  }`}
                >
                  {r.xp_necessario} XP
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HistoricoRecompensas;