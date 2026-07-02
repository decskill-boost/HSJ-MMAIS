import { useEffect, useState } from "react";
import { exerciciosService, type Exercicio } from "../services/exercicios";

// Paciente real da base de dados (pacienteone).
const UTENTES = [
  { id: "892a90f3-2114-4869-a623-0feb0fd4e633", nome: "pacienteone" },
];

const formatarDuracao = (s: number) =>
  s < 60 ? `${s} seg` : `${Math.round(s / 60)} min`;

const guardarPlano = (utenteId: string, dados: unknown) => {
  localStorage.setItem(`plano:${utenteId}`, JSON.stringify(dados));
};
const carregarPlano = (utenteId: string) => {
  try {
    const d = localStorage.getItem(`plano:${utenteId}`);
    return d ? JSON.parse(d) : null;
  } catch {
    return null;
  }
};
// --------------------------------------------------------------------------

export const CriarPlano = () => {
  const [utenteId, setUtenteId] = useState(UTENTES[0].id);

  const [exercicios, setExercicios] = useState<Exercicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [frequenciaSemanal, setFrequenciaSemanal] = useState(3);
  const [dataValidade, setDataValidade] = useState("");
  const [notasMedicas, setNotasMedicas] = useState("");
  const [guardado, setGuardado] = useState(false);

  // Buscar os exercícios REAIS à API, usando o serviço da biblioteca
  useEffect(() => {
    const buscar = async () => {
      try {
        setLoading(true);
        setErro(null);
        const data = await exerciciosService.getAll();
        setExercicios(data.filter((e) => e.ativo)); // só os ativos
      } catch {
        setErro("Não foi possível carregar os exercícios. O backend está a correr?");
      } finally {
        setLoading(false);
      }
    };
    buscar();
  }, []);

  // Ao mudar de utente, restaura o plano guardado (se existir)
  useEffect(() => {
    const plano = carregarPlano(utenteId);
    setSelecionados(plano?.exercicios ?? []);
    setFrequenciaSemanal(plano?.frequencia_semanal ?? 3);
    setDataValidade(plano?.data_validade ? plano.data_validade.slice(0, 10) : "");
    setNotasMedicas(plano?.notas_medicas ?? "");
    setGuardado(false);
  }, [utenteId]);

  const toggle = (id: string) => {
    setGuardado(false);
    setSelecionados((atual) =>
      atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id],
    );
  };

  const guardar = () => {
    guardarPlano(utenteId, {
      id_paciente: utenteId,
      frequencia_semanal: frequenciaSemanal,
      data_validade: dataValidade ? new Date(dataValidade).toISOString() : null,
      notas_medicas: notasMedicas,
      ativo: true,
      exercicios: selecionados,
      atualizadoEm: new Date().toISOString(),
    });
    setGuardado(true);
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
        Criar plano de exercícios
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Seleciona o utente, escolhe exercícios da biblioteca e define a frequência
        semanal, a validade e as notas do plano.
      </p>

      {/* Utente */}
      <div className="mt-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <label className="block text-sm font-semibold text-slate-700">Utente</label>
        <select
          value={utenteId}
          onChange={(e) => setUtenteId(e.target.value)}
          className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        >
          {UTENTES.map((u) => (
            <option key={u.id} value={u.id}>{u.nome}</option>
          ))}
        </select>
      </div>

      {/* Biblioteca */}
      <div className="mt-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900">Biblioteca de exercícios</h2>

        {loading && <p className="mt-3 text-sm text-slate-500">A carregar exercícios…</p>}
        {erro && (
          <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-700">{erro}</p>
        )}

        {!loading && !erro && (
          <ul className="mt-4 space-y-2">
            {exercicios.map((ex) => {
              const ativo = selecionados.includes(ex.id_exercicio);
              return (
                <li key={ex.id_exercicio}>
                  <label
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${
                      ativo ? "border-indigo-300 bg-indigo-50" : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={ativo}
                      onChange={() => toggle(ex.id_exercicio)}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="flex-1">
                      <span className="block text-sm font-semibold text-slate-900">
                        {ex.nome_exercicio}
                      </span>
                      <span className="block text-xs text-slate-500">
                        {ex.categoria} · {formatarDuracao(ex.duracao_segundos)} · dificuldade {ex.dificuldade_clinica}/10
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Detalhes do plano */}
      <div className="mt-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900">
          Detalhes do plano ({selecionados.length} exercício{selecionados.length === 1 ? "" : "s"} selecionado{selecionados.length === 1 ? "" : "s"})
        </h2>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold text-slate-700">
              Frequência semanal (vezes por semana)
            </label>
            <input
              type="number"
              min={1}
              max={7}
              value={frequenciaSemanal}
              onChange={(e) => { setFrequenciaSemanal(Number(e.target.value)); setGuardado(false); }}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700">Data de validade</label>
            <input
              type="date"
              value={dataValidade}
              onChange={(e) => { setDataValidade(e.target.value); setGuardado(false); }}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-semibold text-slate-700">Notas médicas</label>
          <textarea
            rows={3}
            value={notasMedicas}
            onChange={(e) => { setNotasMedicas(e.target.value); setGuardado(false); }}
            placeholder="Indicações ou observações para este plano…"
            className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={guardar}
            disabled={selecionados.length === 0}
            className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Guardar plano
          </button>
          {guardado && <span className="text-sm font-semibold text-green-600">Plano guardado ✓</span>}
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Nota: a gravação do plano é provisória (browser) até existir o endpoint de prescrições.
        </p>
      </div>
    </div>
  );
};

export default CriarPlano;