import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "../../services/supabaseClient";
import { sessoesService } from "../../services/sessoesService";
import type { UserProfile } from "../../types/user";

interface LayoutContext {
  user: UserProfile | null;
}

interface Sessao {
  id_sessao: string;
  data_hora: string;
  duracao: number;
  exercicios: {
    nome_exercicio: string;
    recompensa_xp: number;
  } | null;
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
  const [sessoes, setSessoes] = useState<Sessao[]>([]);
  const [recompensas, setRecompensas] = useState<Recompensa[]>([]);
  const [xpTotal, setXpTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.idUser) return;

    const fetchTudo = async () => {
      try {
        const [historicoData, recompensasData, xpData] = await Promise.all([
          sessoesService.getHistorico(user.idUser),
          supabase.from("recompensas").select("*").order("xp_necessario"),
          supabase.from("utilizadores").select("xp").eq("id_user", user.idUser).single(),
        ]);

        setSessoes(historicoData as unknown as Sessao[]);
        setRecompensas(recompensasData.data ?? []);
        setXpTotal(xpData.data?.xp ?? 0);
      } catch (err) {
        console.error(err);
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
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
          O meu progresso
        </h1>

        {/* XP total */}
        <div className="mt-4 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 p-5 text-white shadow-md">
          <p className="text-sm font-semibold uppercase tracking-widest opacity-80">XP Total</p>
          <p className="text-4xl font-extrabold">{xpTotal} XP ⭐</p>
          {xpParaProxima && (
            <div className="mt-3">
              <div className="flex justify-between text-xs opacity-80 mb-1">
                <span>Próxima recompensa: {xpParaProxima.nome}</span>
                <span>{progressoPercent}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-white/20">
                <div
                  className="h-2 rounded-full bg-white transition-all"
                  style={{ width: `${progressoPercent}%` }}
                />
              </div>
              <p className="mt-1 text-xs opacity-70">
                Faltam {xpParaProxima.xp_necessario - xpTotal} XP
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab("historico")}
          className={`rounded-xl px-5 py-2.5 text-sm font-bold transition ${
            tab === "historico"
              ? "bg-blue-600 text-white shadow"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          📋 Histórico
        </button>
        <button
          onClick={() => setTab("recompensas")}
          className={`rounded-xl px-5 py-2.5 text-sm font-bold transition ${
            tab === "recompensas"
              ? "bg-blue-600 text-white shadow"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          🏆 Recompensas
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">A carregar...</p>
      ) : tab === "historico" ? (
        sessoes.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <p className="text-4xl mb-3">🏃</p>
            <p className="font-semibold text-slate-700">Ainda não fizeste nenhum exercício!</p>
            <p className="text-sm text-slate-400 mt-1">Começa um plano e aparece aqui o teu histórico.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {sessoes.map((s) => (
              <div key={s.id_sessao} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🏅</span>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">
                      {s.exercicios?.nome_exercicio ?? "Exercício"}
                    </p>
                    <p className="text-xs text-slate-400">{formatData(s.data_hora)} · {formatDuracao(s.duracao)}</p>
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-blue-100 px-3 py-1 text-sm font-bold text-blue-700">
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
                className={`rounded-2xl border p-4 shadow-sm flex items-center justify-between gap-4 transition ${
                  desbloqueada
                    ? "border-yellow-300 bg-yellow-50"
                    : "border-slate-200 bg-white opacity-60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{desbloqueada ? r.icone : "🔒"}</span>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{r.nome}</p>
                    <p className="text-xs text-slate-500">{r.descricao}</p>
                  </div>
                </div>
                <span className={`shrink-0 rounded-full px-3 py-1 text-sm font-bold ${
                  desbloqueada
                    ? "bg-yellow-200 text-yellow-800"
                    : "bg-slate-100 text-slate-500"
                }`}>
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