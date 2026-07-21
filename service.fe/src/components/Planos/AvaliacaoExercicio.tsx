import { useState } from "react";
import { sessoesService } from "../../services/sessoesService";

interface Props {
  idPaciente: string;
  idExercicio: string;
  idPrescricao: string;
  duracaoSegundos: number;
  recompensaXp: number;
  onConcluir: () => void;
}

const DIVERSAO = [
  { valor: 1, emoji: "😴", label: "Nada" },
  { valor: 2, emoji: "😕", label: "Pouco" },
  { valor: 3, emoji: "😊", label: "Fixe" },
  { valor: 4, emoji: "😄", label: "Giro" },
  { valor: 5, emoji: "🤩", label: "Incrível!" },
];

const OMNI_LABELS: Record<number, string> = {
  1: "Muito fácil", 2: "Fácil", 3: "Fácil", 4: "Normal", 5: "Normal",
  6: "Difícil", 7: "Difícil", 8: "Muito difícil", 9: "Muito difícil", 10: "Máximo!",
};

const DIFICULDADE = [
  { valor: 1, emoji: "🌱", label: "Muito fácil" },
  { valor: 2, emoji: "😌", label: "Fácil" },
  { valor: 3, emoji: "😅", label: "Normal" },
  { valor: 4, emoji: "😤", label: "Difícil" },
  { valor: 5, emoji: "🥵", label: "Muito difícil" },
];

const TOTAL_STEPS = 6;

const AvaliacaoExercicio = ({
  idExercicio, idPrescricao, duracaoSegundos, recompensaXp, onConcluir,
}: Props) => {
  const [step, setStep] = useState(1);
  const [diversao, setDiversao] = useState(3);
  const [esforco, setEsforco] = useState(5);
  const [dificuldade, setDificuldade] = useState(3);
  const [bpmMedio, setBpmMedio] = useState("");
  const [bpmMaximo, setBpmMaximo] = useState("");
  const [erroBpmMedio, setErroBpmMedio] = useState("");
  const [erroBpmMaximo, setErroBpmMaximo] = useState("");
  const [problemas, setProblemas] = useState<boolean | null>(null);
  const [descricaoProblema, setDescricaoProblema] = useState("");
  const [companhia, setCompanhia] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [concluido, setConcluido] = useState(false);
  const [xpGanho, setXpGanho] = useState(recompensaXp);

  const validarBpm = (raw: string, setter: (v: string) => void, setErro: (e: string) => void) => {
    if (raw === "") { setter(""); setErro(""); return; }
    if (raw.includes(".") || raw.includes(",")) {
      setErro("Não podes usar decimais — escreve um número inteiro.");
      return;
    }
    const val = Number(raw);
    if (val < 0) {
      setErro("O valor não pode ser negativo.");
      return;
    }
    setErro("");
    setter(String(Math.floor(val)));
  };

  const podeAvancar = () => {
    if (step === 4) return bpmMedio !== "" && bpmMaximo !== "" && !erroBpmMedio && !erroBpmMaximo;
    if (step === 5) return problemas !== null;
    if (step === 6) return companhia !== null;
    return true;
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const resultado = await sessoesService.registarSessao({
        id_exercicio: idExercicio,
        id_prescricao: idPrescricao,
        duracao: duracaoSegundos,
        diversao_1_a_5: diversao,
        esforco_1_a_10: esforco,
        fc_media: parseInt(bpmMedio),
        fc_maxima: parseInt(bpmMaximo),
        teve_problemas: problemas ?? false,
        participacao_familiares: companhia ?? false,
      });
      setXpGanho(resultado.xpGained);
      setConcluido(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (concluido) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-black/80 backdrop-blur-sm">
        <span className="animate-bounce text-7xl">🎉</span>
        <h3 className="text-3xl font-extrabold text-white">Muito bem!</h3>
        <p className="text-slate-300">Avaliação registada com sucesso!</p>
        <div className="rounded-full bg-blue-500/20 px-5 py-2">
          <p className="text-lg font-bold text-blue-400">+{xpGanho} XP ganhos! ⭐</p>
        </div>
        <button
          onClick={onConcluir}
          className="mt-2 flex items-center gap-3 rounded-2xl bg-emerald-500 px-8 py-4 text-xl font-extrabold text-white shadow-lg transition hover:bg-emerald-400 active:scale-95"
        >
          🏆 Voltar ao plano
        </button>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex flex-col bg-black/90 backdrop-blur-sm">
      {/* Header com progresso */}
      <div className="flex flex-col gap-3 px-8 pt-6">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-400">
            Passo {step} de {TOTAL_STEPS}
          </p>
          <p className="text-xs font-semibold text-slate-400">
            {Math.round((step / TOTAL_STEPS) * 100)}%
          </p>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-2 rounded-full bg-blue-500 transition-all duration-500"
            style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          />
        </div>
      </div>

      {/* Conteúdo do passo */}
      <div className="flex flex-1 flex-col items-center justify-center px-8">

        {step === 1 && (
          <div className="flex w-full max-w-md flex-col items-center gap-8">
            <h2 className="text-2xl font-extrabold text-white">Foi divertido?</h2>
            <div className="flex w-full flex-col items-center gap-3">
              <span className="text-7xl transition-all duration-200">{DIVERSAO[diversao - 1].emoji}</span>
              <p className="text-lg font-semibold text-slate-300">{DIVERSAO[diversao - 1].label}</p>
              <input type="range" min={1} max={5} step={1} value={diversao}
                onChange={(e) => setDiversao(Number(e.target.value))}
                className="w-full cursor-pointer accent-yellow-400" />
              <div className="flex w-full justify-between text-2xl">
                {DIVERSAO.map((d) => (
                  <span key={d.valor} className={`transition-opacity ${diversao === d.valor ? "opacity-100" : "opacity-30"}`}>{d.emoji}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex w-full max-w-md flex-col items-center gap-8">
            <h2 className="text-2xl font-extrabold text-white">Indica a tua perceção de esforço! 💪</h2>
            <div className="flex w-full flex-col items-center gap-3">
              <span className="text-7xl font-extrabold text-blue-400">{esforco}</span>
              <p className="text-lg font-semibold text-slate-300">{OMNI_LABELS[esforco]}</p>
              <input type="range" min={1} max={10} step={1} value={esforco}
                onChange={(e) => setEsforco(Number(e.target.value))}
                className="w-full cursor-pointer accent-blue-400" />
              <div className="flex w-full justify-between text-sm text-slate-400">
                {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                  <span key={n} className={esforco === n ? "font-bold text-blue-400" : ""}>{n}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex w-full max-w-md flex-col items-center gap-8">
            <h2 className="text-2xl font-extrabold text-white">Dificuldade sentida</h2>
            <div className="flex w-full flex-col items-center gap-3">
              <span className="text-7xl transition-all duration-200">{DIFICULDADE[dificuldade - 1].emoji}</span>
              <p className="text-lg font-semibold text-slate-300">{DIFICULDADE[dificuldade - 1].label}</p>
              <input type="range" min={1} max={5} step={1} value={dificuldade}
                onChange={(e) => setDificuldade(Number(e.target.value))}
                className="w-full cursor-pointer accent-purple-400" />
              <div className="flex w-full justify-between text-2xl">
                {DIFICULDADE.map((d) => (
                  <span key={d.valor} className={`transition-opacity ${dificuldade === d.valor ? "opacity-100" : "opacity-30"}`}>{d.emoji}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="flex w-full max-w-md flex-col items-center gap-8">
            <div className="flex flex-col items-center gap-2">
              <span className="text-5xl">❤️</span>
              <h2 className="text-2xl font-extrabold text-white">Batimentos</h2>
              <p className="text-sm text-slate-400 text-center">Olha para a tua pulseira e escreve os valores que vês!</p>
            </div>
            <div className="flex w-full flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-300">BPM Médio *</label>
                {erroBpmMedio && <p className="text-xs font-semibold text-red-400">⚠️ {erroBpmMedio}</p>}
                <input type="number" placeholder="ex: 95" value={bpmMedio}
                  onChange={(e) => validarBpm(e.target.value, setBpmMedio, setErroBpmMedio)}
                  min={1} max={300} step={1}
                  className={`w-full rounded-2xl bg-white/10 px-4 py-4 text-lg text-white placeholder-slate-500 outline-none focus:ring-2 ${erroBpmMedio ? "ring-2 ring-red-400" : "focus:ring-blue-400"}`} />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-300">BPM Máximo *</label>
                {erroBpmMaximo && <p className="text-xs font-semibold text-red-400">⚠️ {erroBpmMaximo}</p>}
                <input type="number" placeholder="ex: 130" value={bpmMaximo}
                  onChange={(e) => validarBpm(e.target.value, setBpmMaximo, setErroBpmMaximo)}
                  min={1} max={300} step={1}
                  className={`w-full rounded-2xl bg-white/10 px-4 py-4 text-lg text-white placeholder-slate-500 outline-none focus:ring-2 ${erroBpmMaximo ? "ring-2 ring-red-400" : "focus:ring-blue-400"}`} />
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="flex w-full max-w-md flex-col items-center gap-8">
            <div className="flex flex-col items-center gap-2">
              <span className="text-5xl">⚠️</span>
              <h2 className="text-2xl font-extrabold text-white">Houve problemas?</h2>
            </div>
            <div className="flex w-full gap-4">
              <button onClick={() => setProblemas(true)}
                className={`flex-1 rounded-2xl py-5 text-lg font-extrabold transition active:scale-95 ${problemas === true ? "bg-red-500 text-white" : "bg-white/10 text-slate-300 hover:bg-white/20"}`}>
                Sim
              </button>
              <button onClick={() => { setProblemas(false); setDescricaoProblema(""); }}
                className={`flex-1 rounded-2xl py-5 text-lg font-extrabold transition active:scale-95 ${problemas === false ? "bg-green-500 text-white" : "bg-white/10 text-slate-300 hover:bg-white/20"}`}>
                Não
              </button>
            </div>
            {problemas === true && (
              <textarea value={descricaoProblema} onChange={(e) => setDescricaoProblema(e.target.value)}
                placeholder="Descreve o problema..." rows={3}
                className="w-full resize-none rounded-2xl bg-white/10 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-red-400" />
            )}
          </div>
        )}

        {step === 6 && (
          <div className="flex w-full max-w-md flex-col items-center gap-8">
            <div className="flex flex-col items-center gap-2">
              <span className="text-5xl">👥</span>
              <h2 className="text-2xl font-extrabold text-white">Fizeste com companhia?</h2>
            </div>
            <div className="flex w-full gap-4">
              <button onClick={() => setCompanhia(true)}
                className={`flex-1 rounded-2xl py-5 text-lg font-extrabold transition active:scale-95 ${companhia === true ? "bg-blue-500 text-white" : "bg-white/10 text-slate-300 hover:bg-white/20"}`}>
                Sim
              </button>
              <button onClick={() => setCompanhia(false)}
                className={`flex-1 rounded-2xl py-5 text-lg font-extrabold transition active:scale-95 ${companhia === false ? "bg-slate-500 text-white" : "bg-white/10 text-slate-300 hover:bg-white/20"}`}>
                Não
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Botões de navegação */}
      <div className="flex items-center gap-4 px-8 pb-8">
        {step > 1 && (
          <button onClick={() => setStep((s) => s - 1)}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20">
            ←
          </button>
        )}
        {step < TOTAL_STEPS ? (
          <button onClick={() => setStep((s) => s + 1)} disabled={!podeAvancar()}
            className="flex-1 rounded-2xl bg-blue-500 py-4 text-lg font-extrabold text-white transition hover:bg-blue-400 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40">
            Próximo →
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={!podeAvancar() || loading}
            className="flex-1 rounded-2xl bg-green-500 py-4 text-lg font-extrabold text-white transition hover:bg-green-400 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40">
            {loading ? "A guardar..." : "Enviar avaliação"}
          </button>
        )}
      </div>
    </div>
  );
};

export default AvaliacaoExercicio;