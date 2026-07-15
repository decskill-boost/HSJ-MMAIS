import { useState } from "react";
import { sessoesService, type ConclusaoResultado } from "../../services/sessoesService";

interface Props {
  idExercicio: string;
  idPrescricao: string;
  idSessao?: string;
  duracaoSegundos: number;
  recompensaXp: number;
  onConcluir: () => void;
}

const DIVERSAO = [
  { valor: 1, emoji: "😴", label: "Nada divertido" },
  { valor: 2, emoji: "😕", label: "Pouco divertido" },
  { valor: 3, emoji: "😊", label: "Fixe!" },
  { valor: 4, emoji: "😄", label: "Muito divertido!" },
  { valor: 5, emoji: "🤩", label: "Incrível!!" },
];

const ESFORCO = [
  { min: 1, max: 2, emoji: "🌱", label: "Muito fácil" },
  { min: 3, max: 4, emoji: "😌", label: "Fácil" },
  { min: 5, max: 6, emoji: "😅", label: "Normal" },
  { min: 7, max: 8, emoji: "😤", label: "Difícil" },
  { min: 9, max: 10, emoji: "🥵", label: "Muito difícil" },
];

const getEsforcoInfo = (val: number) =>
  ESFORCO.find((e) => val >= e.min && val <= e.max) ?? ESFORCO[2];

const AvaliacaoExercicio = ({
  idExercicio,
  idPrescricao,
  idSessao,
  duracaoSegundos,
  recompensaXp,
  onConcluir,
}: Props) => {
  const [diversao, setDiversao] = useState(3);
  const [esforco, setEsforco] = useState(5);
  const [diversaoTouched, setDiversaoTouched] = useState(false);
  const [esforcoTouched, setEsforcoTouched] = useState(false);
  const [teveProblemas, setTeveProblemas] = useState(false);
  const [participacaoFamiliares, setParticipacaoFamiliares] = useState(false);
  const [fcMedia, setFcMedia] = useState(125);
  const [fcMaxima, setFcMaxima] = useState(160);
  const [loading, setLoading] = useState(false);
  const [concluido, setConcluido] = useState(false);
  const [resultado, setResultado] = useState<ConclusaoResultado | null>(null);

  const diversaoInfo = DIVERSAO[diversao - 1];
  const esforcoInfo = getEsforcoInfo(esforco);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const resposta = await sessoesService.registarSessao({
        id_exercicio: idExercicio,
        id_prescricao: idPrescricao,
        id_sessao: idSessao,
        duracao: duracaoSegundos,
        diversao_1_a_5: diversao,
        esforco_1_a_10: esforco,
        teve_problemas: teveProblemas,
        participacao_familiares: participacaoFamiliares,
        fc_media: fcMedia,
        fc_maxima: fcMaxima,
      });
      setResultado(resposta);
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
        {resultado?.alreadyCompletedToday ? (
          <p className="text-slate-300">Já tinhas concluído este exercício hoje!</p>
        ) : (
          <div className="rounded-full bg-blue-500/20 px-5 py-2">
            <p className="text-lg font-bold text-blue-400">
              +{resultado?.xpGained ?? recompensaXp} XP ganhos! ⭐
            </p>
          </div>
        )}
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
    <div className="absolute inset-0 flex flex-col items-center gap-4 overflow-y-auto bg-black/90 px-6 py-8 backdrop-blur-md">
      <div className="flex flex-col items-center gap-1 text-center">
        <span className="text-3xl">✅</span>
        <h3 className="text-2xl font-extrabold text-white">Exercício concluído!</h3>
        <p className="text-sm text-slate-300">Diz-nos como foi...</p>
      </div>

      {/* Slider Diversão */}
      <div className="w-full max-w-sm rounded-2xl bg-white/10 p-5 backdrop-blur-sm">
        <p className="mb-4 text-center text-base font-bold text-white">Foi divertido?</p>

        <div className="flex flex-col items-center gap-3">
          <span className="text-4xl transition-all duration-200">
            {diversaoInfo.emoji}
          </span>
          <p className="text-sm font-semibold text-slate-300">{diversaoInfo.label}</p>

          <input
            type="range"
            min={1}
            max={5}
            step={1}
            value={diversao}
            onChange={(e) => {
              setDiversao(Number(e.target.value));
              setDiversaoTouched(true);
            }}
            className="w-full cursor-pointer accent-yellow-400"
            style={{ height: "6px" }}
          />
          <div className="flex w-full justify-between text-lg">
            {DIVERSAO.map((d) => (
              <span key={d.valor} className={diversao === d.valor ? "opacity-100" : "opacity-30"}>
                {d.emoji}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Slider Esforço */}
      <div className="w-full max-w-sm rounded-2xl bg-white/10 p-5 backdrop-blur-sm">
        <p className="mb-4 text-center text-base font-bold text-white">Foi difícil?</p>

        <div className="flex flex-col items-center gap-3">
          <span className="text-4xl transition-all duration-200">
            {esforcoInfo.emoji}
          </span>
          <p className="text-sm font-semibold text-slate-300">{esforcoInfo.label}</p>

          <input
            type="range"
            min={1}
            max={10}
            step={1}
            value={esforco}
            onChange={(e) => {
              setEsforco(Number(e.target.value));
              setEsforcoTouched(true);
            }}
            className="w-full cursor-pointer accent-blue-400"
            style={{ height: "6px" }}
          />
          <div className="flex w-full justify-between text-lg">
            {ESFORCO.map((e) => (
              <span key={e.min} className={esforcoInfo.emoji === e.emoji ? "opacity-100" : "opacity-30"}>
                {e.emoji}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Smartwatch & Monitorização */}
      <div className="w-full max-w-sm rounded-2xl bg-white/10 p-5 backdrop-blur-sm text-white">
        <h4 className="text-center font-bold mb-3 text-sm tracking-wide">📡 MONITORIZAÇÃO E SMARTWATCH</h4>
        
        {/* Teve problemas */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-200">Houve algum problema?</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTeveProblemas(true)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${teveProblemas ? "bg-red-500 text-white" : "bg-white/10 text-slate-300 hover:bg-white/20"}`}
            >
              Sim
            </button>
            <button
              type="button"
              onClick={() => setTeveProblemas(false)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${!teveProblemas ? "bg-slate-500 text-white" : "bg-white/10 text-slate-300 hover:bg-white/20"}`}
            >
              Não
            </button>
          </div>
        </div>

        {/* Participação Familiares */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-200">Participação de familiares/amigos?</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setParticipacaoFamiliares(true)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${participacaoFamiliares ? "bg-emerald-500 text-white" : "bg-white/10 text-slate-300 hover:bg-white/20"}`}
            >
              Sim
            </button>
            <button
              type="button"
              onClick={() => setParticipacaoFamiliares(false)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${!participacaoFamiliares ? "bg-slate-500 text-white" : "bg-white/10 text-slate-300 hover:bg-white/20"}`}
            >
              Não
            </button>
          </div>
        </div>

        {/* Smartwatch FC */}
        <div className="border-t border-white/10 pt-3">
          <p className="text-[11px] text-slate-400 mb-2 flex items-center gap-1">
            <span>⌚ Smartwatch (Simulação de Dados)</span>
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-slate-300 mb-1">FC Média (bpm)</label>
              <input
                type="number"
                value={fcMedia}
                onChange={(e) => setFcMedia(Number(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-yellow-400"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-300 mb-1">FC Máxima (bpm)</label>
              <input
                type="number"
                value={fcMaxima}
                onChange={(e) => setFcMaxima(Number(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-yellow-400"
              />
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!diversaoTouched || !esforcoTouched || loading}
        className="flex items-center gap-3 rounded-xl bg-green-500 px-6 py-3 text-base font-extrabold text-white shadow-lg transition hover:bg-green-400 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {loading ? "A guardar..." : "Enviar avaliação"}
      </button>
      {(!diversaoTouched || !esforcoTouched) && (
        <p className="text-xs text-slate-400">Move os dois sliders para poderes enviar</p>
      )}
    </div>
  );
};

export default AvaliacaoExercicio;