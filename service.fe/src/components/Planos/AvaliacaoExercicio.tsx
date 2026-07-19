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
  idPaciente, idExercicio, idPrescricao, duracaoSegundos, recompensaXp, onConcluir,
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
      await sessoesService.registarSessao({
        id_paciente: idPaciente,
        id_exercicio: idExercicio,
        id_prescricao: idPrescricao,
        duracao: duracaoSegundos,
        diversao_1_a_5: diversao,
        esforco_1_a_10: esforco,
        dificuldade_crianca: dificuldade,
        bpm_medio: parseInt(bpmMedio),
        bpm_maximo: parseInt(bpmMaximo),
        problemas_treino: problemas,
        companhia,
        descricao_problema: problemas ? descricaoProblema : null,
      });
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
        <h3 className="text-3xl font-extrabold text-papel">Muito bem!</h3>
        <p className="text-tinta/20">Avaliação registada com sucesso!</p>
        <div className="rounded-full bg-cobalto/20 px-5 py-2">
          <p className="text-lg font-bold text-cobalto-vivo">+{recompensaXp} XP ganhos! ⭐</p>
        </div>
        <button
          onClick={onConcluir}
          className="mt-2 flex items-center gap-3 rounded-2xl bg-turbo/100 px-8 py-4 text-xl font-extrabold text-papel shadow-lg transition hover:bg-turbo active:scale-95"
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
          <p className="text-xs font-semibold text-aco">
            Passo {step} de {TOTAL_STEPS}
          </p>
          <p className="text-xs font-semibold text-aco">
            {Math.round((step / TOTAL_STEPS) * 100)}%
          </p>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-papel-claro/10">
          <div
            className="h-2 rounded-full bg-cobalto transition-all duration-500"
            style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          />
        </div>
      </div>

      {/* Conteúdo do passo */}
      <div className="flex flex-1 flex-col items-center justify-center px-8">

        {/* Passo 1 — Diversão */}
        {step === 1 && (
          <div className="flex w-full max-w-md flex-col items-center gap-8">
            <div className="flex flex-col items-center gap-2">
              <h2 className="text-2xl font-extrabold text-papel">Foi divertido?</h2>
            </div>
            <div className="flex w-full flex-col items-center gap-3">
              <span className="text-7xl transition-all duration-200">{DIVERSAO[diversao - 1].emoji}</span>
              <p className="text-lg font-semibold text-tinta/20">{DIVERSAO[diversao - 1].label}</p>
              <input
                type="range" min={1} max={5} step={1} value={diversao}
                onChange={(e) => setDiversao(Number(e.target.value))}
                className="w-full cursor-pointer accent-yellow-400"
              />
              <div className="flex w-full justify-between text-2xl">
                {DIVERSAO.map((d) => (
                  <span key={d.valor} className={`transition-opacity ${diversao === d.valor ? "opacity-100" : "opacity-30"}`}>
                    {d.emoji}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Passo 2 — Perceção de esforço */}
        {step === 2 && (
          <div className="flex w-full max-w-md flex-col items-center gap-8">
            <div className="flex flex-col items-center gap-2">
              <h2 className="text-2xl font-extrabold text-papel">Indica a tua perceção de esforço! 💪</h2>
            </div>
            <div className="flex w-full flex-col items-center gap-3">
              <span className="text-7xl font-extrabold text-cobalto-vivo">{esforco}</span>
              <p className="text-lg font-semibold text-tinta/20">{OMNI_LABELS[esforco]}</p>
              <input
                type="range" min={1} max={10} step={1} value={esforco}
                onChange={(e) => setEsforco(Number(e.target.value))}
                className="w-full cursor-pointer accent-cobalto-vivo"
              />
              <div className="flex w-full justify-between text-sm text-aco">
                {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                  <span key={n} className={esforco === n ? "font-bold text-cobalto-vivo" : ""}>{n}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Passo 3 — Dificuldade sentida */}
        {step === 3 && (
          <div className="flex w-full max-w-md flex-col items-center gap-8">
            <div className="flex flex-col items-center gap-2">
              <h2 className="text-2xl font-extrabold text-papel">Dificuldade sentida</h2>
            </div>
            <div className="flex w-full flex-col items-center gap-3">
              <span className="text-7xl transition-all duration-200">{DIFICULDADE[dificuldade - 1].emoji}</span>
              <p className="text-lg font-semibold text-tinta/20">{DIFICULDADE[dificuldade - 1].label}</p>
              <input
                type="range" min={1} max={5} step={1} value={dificuldade}
                onChange={(e) => setDificuldade(Number(e.target.value))}
                className="w-full cursor-pointer accent-purple-400"
              />
              <div className="flex w-full justify-between text-2xl">
                {DIFICULDADE.map((d) => (
                  <span key={d.valor} className={`transition-opacity ${dificuldade === d.valor ? "opacity-100" : "opacity-30"}`}>
                    {d.emoji}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Passo 4 — Batimentos */}
        {step === 4 && (
          <div className="flex w-full max-w-md flex-col items-center gap-8">
            <div className="flex flex-col items-center gap-2">
              <span className="text-5xl">❤️</span>
              <h2 className="text-2xl font-extrabold text-papel">Batimentos</h2>
              <p className="text-sm text-aco text-center">
                Olha para a tua pulseira e escreve os valores que vês!
              </p>
            </div>
            <div className="flex w-full flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-tinta/20">BPM Médio *</label>
                {erroBpmMedio && (
                  <p className="text-xs font-semibold text-capa">⚠️ {erroBpmMedio}</p>
                )}
                <input
                  type="number" placeholder="ex: 95" value={bpmMedio}
                  onChange={(e) => validarBpm(e.target.value, setBpmMedio, setErroBpmMedio)}
                  min={1} max={300} step={1}
                  className={`w-full rounded-2xl bg-papel-claro/10 px-4 py-4 text-lg text-papel placeholder-aco outline-none focus:ring-2 ${erroBpmMedio ? "ring-2 ring-capa" : "focus:ring-cobalto-vivo"}`}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-tinta/20">BPM Máximo *</label>
                {erroBpmMaximo && (
                  <p className="text-xs font-semibold text-capa">⚠️ {erroBpmMaximo}</p>
                )}
                <input
                  type="number" placeholder="ex: 130" value={bpmMaximo}
                  onChange={(e) => validarBpm(e.target.value, setBpmMaximo, setErroBpmMaximo)}
                  min={1} max={300} step={1}
                  className={`w-full rounded-2xl bg-papel-claro/10 px-4 py-4 text-lg text-papel placeholder-aco outline-none focus:ring-2 ${erroBpmMaximo ? "ring-2 ring-capa" : "focus:ring-cobalto-vivo"}`}
                />
              </div>
            </div>
          </div>
        )}

        {/* Passo 5 — Problemas */}
        {step === 5 && (
          <div className="flex w-full max-w-md flex-col items-center gap-8">
            <div className="flex flex-col items-center gap-2">
              <span className="text-5xl">⚠️</span>
              <h2 className="text-2xl font-extrabold text-papel">Houve problemas?</h2>
            </div>
            <div className="flex w-full gap-4">
              <button
                onClick={() => setProblemas(true)}
                className={`flex-1 rounded-2xl py-5 text-lg font-extrabold transition active:scale-95 ${problemas === true ? "bg-capa text-papel" : "bg-papel-claro/10 text-tinta/20 hover:bg-papel-claro/20"}`}
              >
                Sim
              </button>
              <button
                onClick={() => { setProblemas(false); setDescricaoProblema(""); }}
                className={`flex-1 rounded-2xl py-5 text-lg font-extrabold transition active:scale-95 ${problemas === false ? "bg-turbo/100 text-papel" : "bg-papel-claro/10 text-tinta/20 hover:bg-papel-claro/20"}`}
              >
                Não
              </button>
            </div>
            {problemas === true && (
              <textarea
                value={descricaoProblema}
                onChange={(e) => setDescricaoProblema(e.target.value)}
                placeholder="Descreve o problema..."
                rows={3}
                className="w-full resize-none rounded-2xl bg-papel-claro/10 px-4 py-3 text-sm text-papel placeholder-aco outline-none focus:ring-2 focus:ring-capa"
              />
            )}
          </div>
        )}

        {/* Passo 6 — Companhia */}
        {step === 6 && (
          <div className="flex w-full max-w-md flex-col items-center gap-8">
            <div className="flex flex-col items-center gap-2">
              <span className="text-5xl">👥</span>
              <h2 className="text-2xl font-extrabold text-papel">Fizeste com companhia?</h2>
            </div>
            <div className="flex w-full gap-4">
              <button
                onClick={() => setCompanhia(true)}
                className={`flex-1 rounded-2xl py-5 text-lg font-extrabold transition active:scale-95 ${companhia === true ? "bg-cobalto text-papel" : "bg-papel-claro/10 text-tinta/20 hover:bg-papel-claro/20"}`}
              >
                Sim
              </button>
              <button
                onClick={() => setCompanhia(false)}
                className={`flex-1 rounded-2xl py-5 text-lg font-extrabold transition active:scale-95 ${companhia === false ? "bg-aco text-papel" : "bg-papel-claro/10 text-tinta/20 hover:bg-papel-claro/20"}`}
              >
                Não
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Botões de navegação */}
      <div className="flex items-center gap-4 px-8 pb-8">
        {step > 1 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-papel-claro/10 text-papel transition hover:bg-papel-claro/20"
          >
            ←
          </button>
        )}

        {step < TOTAL_STEPS ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={!podeAvancar()}
            className="flex-1 rounded-2xl bg-cobalto py-4 text-lg font-extrabold text-papel transition hover:bg-cobalto-vivo active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Próximo →
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!podeAvancar() || loading}
            className="flex-1 rounded-2xl bg-turbo/100 py-4 text-lg font-extrabold text-papel transition hover:bg-turbo active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? "A guardar..." : "Enviar avaliação"}
          </button>
        )}
      </div>
    </div>
  );
};

export default AvaliacaoExercicio;