import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { exerciciosService, type Exercicio } from "../services/exercicios";
import { pacientesService, type Paciente } from "../services/pacientes";
import { useUser } from "../contexts/UserContext";
import { planosService } from "../services/planosService";

// Mostrar duração como a biblioteca (minutos)
const formatarDuracao = (s: number) =>
  s < 60 ? `${s} seg` : `${Math.round(s / 60)} min`;

// Mostrar dificuldade em texto, como a biblioteca
const textoDificuldade = (d: number) =>
  d <= 3 ? "Fácil" : d <= 6 ? "Médio" : "Difícil";

// Faixas dos filtros (iguais às da biblioteca)
const faixaDificuldade = (d: number) =>
  d <= 3 ? "facil" : d <= 6 ? "medio" : "dificil";
const faixaDuracao = (s: number) =>
  s <= 300 ? "ate5" : s <= 900 ? "5a15" : "mais15"; // ≤5min / 5–15min / +15min

export const CriarPlano = () => {
  const { user } = useUser();

  // Pacientes reais (Supabase)
  const [utentes, setUtentes] = useState<Paciente[]>([]);
  const [utenteId, setUtenteId] = useState("");

  const [exercicios, setExercicios] = useState<Exercicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [searchParams] = useSearchParams();

  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [frequenciaSemanal, setFrequenciaSemanal] = useState(3);
  const [dataValidade, setDataValidade] = useState("");
  const [notasMedicas, setNotasMedicas] = useState("");

  // Estado da gravação
  const [aGuardar, setAGuardar] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [erroGuardar, setErroGuardar] = useState<string | null>(null);

  // Filtros (iguais aos da biblioteca)
  const [filtroCategoria, setFiltroCategoria] = useState("todas");
  const [filtroDificuldade, setFiltroDificuldade] = useState("todas");
  const [filtroDuracao, setFiltroDuracao] = useState("todas");

  const limparFiltros = () => {
    setFiltroCategoria("todas");
    setFiltroDificuldade("todas");
    setFiltroDuracao("todas");
  };

  // Buscar os exercícios reais à API
  useEffect(() => {
    const buscar = async () => {
      try {
        setLoading(true);
        setErro(null);
        const data = await exerciciosService.getAll();
        setExercicios(data.filter((e) => e.ativo));
      } catch {
        setErro(
          "Não foi possível carregar os exercícios. O backend está a correr?",
        );
      } finally {
        setLoading(false);
      }
    };
    buscar();
  }, []);

  // Buscar os pacientes reais (Supabase)
  useEffect(() => {
    const buscar = async () => {
      try {
        const lista = await pacientesService.getPacientes();
        setUtentes(lista);
        const pacienteQuery = searchParams.get("paciente");
        if (pacienteQuery && lista.some((u) => u.id_user === pacienteQuery)) {
          setUtenteId(pacienteQuery);
        } else if (lista.length > 0) {
          setUtenteId(lista[0].id_user);
        }
      } catch (e) {
        console.error("Falha ao carregar pacientes:", e);
      }
    };
    buscar();
  }, [searchParams]);

  const categorias = useMemo(() => {
    const set = new Set(exercicios.map((e) => e.categoria).filter(Boolean));
    return Array.from(set).sort();
  }, [exercicios]);

  const exerciciosFiltrados = useMemo(() => {
    return exercicios.filter((ex) => {
      if (filtroCategoria !== "todas" && ex.categoria !== filtroCategoria)
        return false;
      if (
        filtroDificuldade !== "todas" &&
        faixaDificuldade(ex.dificuldade_clinica) !== filtroDificuldade
      )
        return false;
      if (
        filtroDuracao !== "todas" &&
        faixaDuracao(ex.duracao_segundos) !== filtroDuracao
      )
        return false;
      return true;
    });
  }, [exercicios, filtroCategoria, filtroDificuldade, filtroDuracao]);

  const toggle = (id: string) => {
    setGuardado(false);
    setSelecionados((atual) =>
      atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id],
    );
  };

  // Guardar o plano na base de dados (Supabase)
  const guardar = async () => {
    if (!utenteId || !user) return;
    setAGuardar(true);
    setErroGuardar(null);
    setGuardado(false);
    try {
      await planosService.criarPlano({
        id_paciente: utenteId,
        id_medico: user.idUser,
        frequencia_semanal: frequenciaSemanal,
        data_validade: dataValidade
          ? new Date(dataValidade).toISOString()
          : null,
        notas_medicas: notasMedicas,
        exercicios: selecionados,
      });
      setGuardado(true);
      // limpar depois de guardar
      setSelecionados([]);
      setNotasMedicas("");
    } catch (e) {
      setErroGuardar(
        e instanceof Error ? e.message : "Não foi possível guardar o plano.",
      );
    } finally {
      setAGuardar(false);
    }
  };

  const estiloSelect =
    "mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20";

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
        Criar plano de exercícios
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Seleciona o utente, filtra e escolhe exercícios da biblioteca e define a
        frequência semanal, a validade e as notas do plano.
      </p>

      {/* Utente */}
      <div className="mt-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <label className="block text-sm font-semibold text-slate-700">
          Utente
        </label>
        <select
          value={utenteId}
          onChange={(e) => setUtenteId(e.target.value)}
          className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        >
          {utentes.length === 0 ? (
            <option value="">A carregar pacientes…</option>
          ) : (
            utentes.map((u) => (
              <option key={u.id_user} value={u.id_user}>
                {u.nome}
              </option>
            ))
          )}
        </select>
      </div>

      {/* Biblioteca + Filtros */}
      <div className="mt-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900">
          Biblioteca de exercícios
        </h2>

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div className="min-w-[140px] flex-1">
            <label className="block text-xs font-semibold text-slate-600">
              Categoria
            </label>
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className={estiloSelect}
            >
              <option value="todas">Todas</option>
              {categorias.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-[130px] flex-1">
            <label className="block text-xs font-semibold text-slate-600">
              Duração
            </label>
            <select
              value={filtroDuracao}
              onChange={(e) => setFiltroDuracao(e.target.value)}
              className={estiloSelect}
            >
              <option value="todas">Todas</option>
              <option value="ate5">Até 5 min</option>
              <option value="5a15">5–15 min</option>
              <option value="mais15">Mais de 15 min</option>
            </select>
          </div>
          <div className="min-w-[120px] flex-1">
            <label className="block text-xs font-semibold text-slate-600">
              Dificuldade
            </label>
            <select
              value={filtroDificuldade}
              onChange={(e) => setFiltroDificuldade(e.target.value)}
              className={estiloSelect}
            >
              <option value="todas">Todas</option>
              <option value="facil">Fácil</option>
              <option value="medio">Médio</option>
              <option value="dificil">Difícil</option>
            </select>
          </div>
          <button
            type="button"
            onClick={limparFiltros}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700"
          >
            Limpar filtros
          </button>
        </div>

        {loading && (
          <p className="mt-4 text-sm text-slate-500">A carregar exercícios…</p>
        )}
        {erro && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-700">
            {erro}
          </p>
        )}

        {!loading && !erro && (
          <>
            <p className="mt-4 text-xs text-slate-400">
              {exerciciosFiltrados.length} de {exercicios.length} exercícios
            </p>
            {exerciciosFiltrados.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">
                Nenhum exercício corresponde a estes filtros.
              </p>
            ) : (
              <ul className="mt-2 space-y-2">
                {exerciciosFiltrados.map((ex) => {
                  const ativo = selecionados.includes(ex.id_exercicio);
                  return (
                    <li key={ex.id_exercicio}>
                      <label
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${
                          ativo
                            ? "border-indigo-300 bg-indigo-50"
                            : "border-slate-200 hover:bg-slate-50"
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
                            {ex.categoria} ·{" "}
                            {formatarDuracao(ex.duracao_segundos)} ·{" "}
                            {textoDificuldade(ex.dificuldade_clinica)}
                          </span>
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </div>

      {/* Detalhes do plano */}
      <div className="mt-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900">
          Detalhes do plano ({selecionados.length} exercício
          {selecionados.length === 1 ? "" : "s"} selecionado
          {selecionados.length === 1 ? "" : "s"})
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
              onChange={(e) => {
                setFrequenciaSemanal(Number(e.target.value));
                setGuardado(false);
              }}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700">
              Data de validade
            </label>
            <input
              type="date"
              value={dataValidade}
              onChange={(e) => {
                setDataValidade(e.target.value);
                setGuardado(false);
              }}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-semibold text-slate-700">
            Notas médicas
          </label>
          <textarea
            rows={3}
            value={notasMedicas}
            onChange={(e) => {
              setNotasMedicas(e.target.value);
              setGuardado(false);
            }}
            placeholder="Indicações ou observações para este plano…"
            className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={guardar}
            disabled={selecionados.length === 0 || !utenteId || aGuardar}
            className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {aGuardar ? "A guardar…" : "Guardar plano"}
          </button>
          {guardado && (
            <span className="text-sm font-semibold text-green-600">
              Plano guardado ✓
            </span>
          )}
        </div>
        {erroGuardar && (
          <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-700">
            {erroGuardar}
          </p>
        )}
      </div>
    </div>
  );
};

export default CriarPlano;
