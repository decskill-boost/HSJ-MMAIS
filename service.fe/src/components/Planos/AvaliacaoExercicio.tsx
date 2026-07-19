import { useState } from "react";
import { sessoesService } from "../../services/sessoesService";
import CapitaoMais from "../CapitaoMais";

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

// Frases do Capitão para cada passo — companhia, não cobrança
const FRASES_CAPITAO: Record<number, string> = {
  1: "Missão cumprida! Conta-me tudo…",
  2: "Sê sincero — heróis não fazem batota!",
  3: "Não há respostas erradas, palavra de Capitão.",
  4: "Espreita a tua pulseira mágica!",
  5: "Se algo correu mal, quero saber para te ajudar.",
  6: "Última pergunta, prometo!",
};

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

  // Interação simples: um toque escolhe E avança (com pausa para ver a escolha)
  const avancoAutomatico = () => {
    setTimeout(() => setStep((s) => Math.min(s + 1, TOTAL_STEPS)), 450);
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
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 overflow-hidden bg-[linear-gradient(160deg,#3D6BFF_0%,#1D42C8_55%,#16307F_100%)]">
        <div className="fundo-raios absolute -inset-[40%] opacity-15" aria-hidden="true" />
        <div className="fundo-reticula absolute inset-0 opacity-50" aria-hidden="true" />
        {/* confetes de papel */}
        <span className="animate-flutuar absolute left-[12%] top-[18%] h-4 w-4 rounded-full border-2 border-tinta bg-turbo" aria-hidden="true" />
        <span className="animate-flutuar absolute right-[14%] top-[24%] h-4 w-4 rotate-12 border-2 border-tinta bg-raio" style={{ animationDelay: "0.7s" }} aria-hidden="true" />
        <span className="animate-flutuar absolute left-[20%] bottom-[22%] h-3 w-3 rounded-full border-2 border-tinta bg-capa" style={{ animationDelay: "1.4s" }} aria-hidden="true" />
        <span className="animate-flutuar absolute right-[22%] bottom-[30%] h-3 w-3 border-2 border-tinta bg-papel" style={{ animationDelay: "2.1s" }} aria-hidden="true" />

        {/* splash CATRAPUM + Capitão */}
        <div className="entrada-pop relative">
          <svg viewBox="0 0 120 100" className="absolute -right-16 -top-8 w-28 rotate-6" aria-hidden="true">
            <path d="M60 2 71 24 95 12 86 34 112 38 90 52 108 70 82 66 84 92 66 74 54 98 48 72 26 84 36 62 10 58 32 46 16 26 42 32 44 8 Z"
              fill="#FFCE29" stroke="#141F3C" strokeWidth="4" strokeLinejoin="round" />
            <text x="60" y="56" textAnchor="middle" style={{ fontFamily: "Bangers" }} fontSize="20" fill="#141F3C">
              CATRAPUM!
            </text>
          </svg>
          <div className="animate-flutuar">
            <CapitaoMais className="h-32 w-auto" title="" />
          </div>
        </div>

        <h3 className="texto-autocolante relative font-display text-4xl tracking-wide">
          Missão completa!
        </h3>
        <p className="relative text-sm font-bold text-[#C9D2F2]">
          A tua avaliação foi registada. O Capitão está orgulhoso!
        </p>
        <div className="entrada-pop-2 relative rounded-2xl border-[3px] border-tinta bg-linear-to-b from-raio to-raio-fundo px-6 py-2 shadow-vinheta">
          <p className="font-display text-2xl tracking-wide text-tinta">
            ⭐ +{recompensaXp} XP
          </p>
        </div>
        <button
          onClick={onConcluir}
          className="entrada-pop-3 relative mt-1 flex items-center gap-3 rounded-2xl border-[3px] border-tinta bg-papel-claro px-8 py-4 font-display text-xl tracking-wide text-tinta shadow-vinheta transition hover:bg-papel active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
        >
          🏆 Voltar ao plano
        </button>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden bg-[linear-gradient(160deg,#1D42C8_0%,#16307F_100%)]">
      <div className="fundo-reticula absolute inset-0 opacity-40" aria-hidden="true" />

      {/* Header com progresso */}
      <div className="relative flex flex-col gap-2 px-8 pt-6">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-widest text-[#C9D2F2]">
            Passo {step} de {TOTAL_STEPS}
          </p>
          <p className="text-xs font-bold text-[#C9D2F2]">
            {Math.round((step / TOTAL_STEPS) * 100)}%
          </p>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full border-2 border-tinta bg-tinta/40">
          <div
            className="h-full rounded-full bg-linear-to-r from-raio to-raio-fundo transition-all duration-500"
            style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          />
        </div>
        {/* Capitão comentador */}
        <div className="mt-1 flex items-center justify-center gap-2">
          <CapitaoMais className="h-9 w-auto" title="" />
          <p className="rounded-xl rounded-bl-none border-2 border-tinta bg-papel-claro px-3 py-1 text-xs font-bold text-tinta">
            {FRASES_CAPITAO[step]}
          </p>
        </div>
      </div>

      {/* Conteúdo do passo */}
      <div className="relative flex flex-1 flex-col items-center justify-center px-8">

        {/* Passo 1 — Diversão */}
        {step === 1 && (
          <div className="entrada-pop flex w-full max-w-md flex-col items-center gap-6">
            <h2 className="texto-autocolante font-display text-3xl tracking-wide">
              Foi divertido?
            </h2>
            <div className="flex w-full flex-col items-center gap-4">
              <p className="font-display text-xl tracking-wide text-raio [text-shadow:1.5px_1.5px_0_#141F3C]">
                {DIVERSAO[diversao - 1].label}
              </p>
              <div className="flex w-full justify-center gap-2 sm:gap-3">
                {DIVERSAO.map((d) => (
                  <button
                    key={d.valor}
                    onClick={() => { setDiversao(d.valor); avancoAutomatico(); }}
                    aria-label={d.label}
                    aria-pressed={diversao === d.valor}
                    className={`flex h-16 w-16 items-center justify-center rounded-2xl border-[3px] border-tinta text-4xl transition-all active:scale-90 sm:h-20 sm:w-20 sm:text-5xl ${
                      diversao === d.valor
                        ? "scale-110 bg-raio shadow-vinheta"
                        : "bg-papel-claro/15 hover:bg-papel-claro/30"
                    }`}
                  >
                    {d.emoji}
                  </button>
                ))}
              </div>
              <p className="text-xs font-bold text-[#9FB0E8]">Toca na carinha certa!</p>
            </div>
          </div>
        )}

        {/* Passo 2 — Perceção de esforço */}
        {step === 2 && (
          <div className="entrada-pop flex w-full max-w-md flex-col items-center gap-6">
            <h2 className="texto-autocolante text-center font-display text-3xl tracking-wide">
              Quanto esforço fizeste? 💪
            </h2>
            <div className="flex w-full flex-col items-center gap-4">
              <p className="text-lg font-bold text-[#C9D2F2]">{OMNI_LABELS[esforco]}</p>
              <div className="grid grid-cols-5 gap-2 sm:gap-3" role="group" aria-label="Perceção de esforço de 1 a 10">
                {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                  <button
                    key={n}
                    onClick={() => { setEsforco(n); avancoAutomatico(); }}
                    aria-pressed={esforco === n}
                    className={`flex h-14 w-14 items-center justify-center rounded-full border-[3px] border-tinta font-display text-xl tracking-wide transition-all active:scale-90 sm:h-16 sm:w-16 ${
                      esforco === n
                        ? "scale-110 bg-turbo text-tinta shadow-vinheta"
                        : "bg-papel-claro/15 text-papel hover:bg-papel-claro/30"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <p className="text-xs font-bold text-[#9FB0E8]">1 = passeio · 10 = esforço máximo</p>
            </div>
          </div>
        )}

        {/* Passo 3 — Dificuldade sentida */}
        {step === 3 && (
          <div className="entrada-pop flex w-full max-w-md flex-col items-center gap-6">
            <h2 className="texto-autocolante font-display text-3xl tracking-wide">
              Foi difícil?
            </h2>
            <div className="flex w-full flex-col items-center gap-4">
              <p className="font-display text-xl tracking-wide text-raio [text-shadow:1.5px_1.5px_0_#141F3C]">
                {DIFICULDADE[dificuldade - 1].label}
              </p>
              <div className="flex w-full justify-center gap-2 sm:gap-3">
                {DIFICULDADE.map((d) => (
                  <button
                    key={d.valor}
                    onClick={() => { setDificuldade(d.valor); avancoAutomatico(); }}
                    aria-label={d.label}
                    aria-pressed={dificuldade === d.valor}
                    className={`flex h-16 w-16 items-center justify-center rounded-2xl border-[3px] border-tinta text-4xl transition-all active:scale-90 sm:h-20 sm:w-20 sm:text-5xl ${
                      dificuldade === d.valor
                        ? "scale-110 bg-capa shadow-vinheta"
                        : "bg-papel-claro/15 hover:bg-papel-claro/30"
                    }`}
                  >
                    {d.emoji}
                  </button>
                ))}
              </div>
              <p className="text-xs font-bold text-[#9FB0E8]">Toca na carinha certa!</p>
            </div>
          </div>
        )}

        {/* Passo 4 — Batimentos */}
        {step === 4 && (
          <div className="entrada-pop flex w-full max-w-md flex-col items-center gap-6">
            <div className="flex flex-col items-center gap-2">
              <span className="text-5xl">❤️</span>
              <h2 className="texto-autocolante font-display text-3xl tracking-wide">
                Batimentos
              </h2>
              <p className="text-center text-sm font-bold text-[#C9D2F2]">
                Olha para a tua pulseira e escreve os valores que vês!
              </p>
            </div>
            <div className="flex w-full flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-papel">BPM Médio *</label>
                {erroBpmMedio && (
                  <p className="rounded-lg border-2 border-capa bg-capa/20 px-2 py-1 text-xs font-bold text-papel">
                    ⚠️ {erroBpmMedio}
                  </p>
                )}
                <input
                  type="number" inputMode="numeric" placeholder="ex: 95" value={bpmMedio}
                  onChange={(e) => validarBpm(e.target.value, setBpmMedio, setErroBpmMedio)}
                  min={1} max={300} step={1}
                  className={`w-full rounded-2xl border-2 bg-papel-claro px-4 py-4 text-lg font-bold text-tinta placeholder-aco outline-none transition ${erroBpmMedio ? "border-capa ring-2 ring-capa/40" : "border-tinta focus:ring-2 focus:ring-raio"}`}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-papel">BPM Máximo *</label>
                {erroBpmMaximo && (
                  <p className="rounded-lg border-2 border-capa bg-capa/20 px-2 py-1 text-xs font-bold text-papel">
                    ⚠️ {erroBpmMaximo}
                  </p>
                )}
                <input
                  type="number" inputMode="numeric" placeholder="ex: 130" value={bpmMaximo}
                  onChange={(e) => validarBpm(e.target.value, setBpmMaximo, setErroBpmMaximo)}
                  min={1} max={300} step={1}
                  className={`w-full rounded-2xl border-2 bg-papel-claro px-4 py-4 text-lg font-bold text-tinta placeholder-aco outline-none transition ${erroBpmMaximo ? "border-capa ring-2 ring-capa/40" : "border-tinta focus:ring-2 focus:ring-raio"}`}
                />
              </div>
            </div>
          </div>
        )}

        {/* Passo 5 — Problemas */}
        {step === 5 && (
          <div className="entrada-pop flex w-full max-w-md flex-col items-center gap-6">
            <div className="flex flex-col items-center gap-2">
              <h2 className="texto-autocolante font-display text-3xl tracking-wide">
                Correu tudo bem?
              </h2>
              <p className="text-sm font-bold text-[#C9D2F2]">
                Doeu alguma coisa, ficaste tonto, algo estranho?
              </p>
            </div>
            <div className="flex w-full gap-4">
              <button
                onClick={() => setProblemas(true)}
                className={`flex-1 rounded-2xl border-[3px] border-tinta py-5 font-display text-xl tracking-wide transition active:scale-95 ${problemas === true ? "bg-capa text-papel shadow-vinheta" : "bg-papel-claro/15 text-papel hover:bg-papel-claro/25"}`}
              >
                Houve algo 😕
              </button>
              <button
                onClick={() => { setProblemas(false); setDescricaoProblema(""); avancoAutomatico(); }}
                className={`flex-1 rounded-2xl border-[3px] border-tinta py-5 font-display text-xl tracking-wide transition active:scale-95 ${problemas === false ? "bg-turbo text-tinta shadow-vinheta" : "bg-papel-claro/15 text-papel hover:bg-papel-claro/25"}`}
              >
                Tudo bem! 👍
              </button>
            </div>
            {problemas === true && (
              <textarea
                value={descricaoProblema}
                onChange={(e) => setDescricaoProblema(e.target.value)}
                placeholder="Conta-me o que aconteceu…"
                rows={3}
                className="entrada-pop w-full resize-none rounded-2xl border-2 border-tinta bg-papel-claro px-4 py-3 text-sm font-bold text-tinta placeholder-aco outline-none focus:ring-2 focus:ring-capa"
              />
            )}
          </div>
        )}

        {/* Passo 6 — Companhia */}
        {step === 6 && (
          <div className="entrada-pop flex w-full max-w-md flex-col items-center gap-6">
            <div className="flex flex-col items-center gap-2">
              <span className="text-5xl">👥</span>
              <h2 className="texto-autocolante text-center font-display text-3xl tracking-wide">
                Treinaste com companhia?
              </h2>
            </div>
            <div className="flex w-full gap-4">
              <button
                onClick={() => setCompanhia(true)}
                className={`flex-1 rounded-2xl border-[3px] border-tinta py-5 font-display text-xl tracking-wide transition active:scale-95 ${companhia === true ? "bg-cobalto-vivo text-papel shadow-vinheta" : "bg-papel-claro/15 text-papel hover:bg-papel-claro/25"}`}
              >
                Sim! 🦸🦸
              </button>
              <button
                onClick={() => setCompanhia(false)}
                className={`flex-1 rounded-2xl border-[3px] border-tinta py-5 font-display text-xl tracking-wide transition active:scale-95 ${companhia === false ? "bg-cobalto-vivo text-papel shadow-vinheta" : "bg-papel-claro/15 text-papel hover:bg-papel-claro/25"}`}
              >
                Sozinho 🦸
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Botões de navegação */}
      <div className="relative flex items-center gap-4 px-8 pb-8">
        {step > 1 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            aria-label="Passo anterior"
            className="flex h-14 w-14 items-center justify-center rounded-full border-[3px] border-tinta bg-papel-claro/15 text-xl text-papel transition hover:bg-papel-claro/25"
          >
            ←
          </button>
        )}

        {step < TOTAL_STEPS ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={!podeAvancar()}
            className="flex-1 rounded-2xl border-[3px] border-tinta bg-linear-to-b from-raio to-raio-fundo py-4 font-display text-xl tracking-wide text-tinta shadow-vinheta transition hover:brightness-105 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-vinheta"
          >
            Próximo →
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!podeAvancar() || loading}
            className="flex-1 rounded-2xl border-[3px] border-tinta bg-turbo py-4 font-display text-xl tracking-wide text-tinta shadow-vinheta transition hover:brightness-105 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-vinheta"
          >
            {loading ? "A guardar…" : "Enviar — CATRAPUM!"}
          </button>
        )}
      </div>
    </div>
  );
};

export default AvaliacaoExercicio;
