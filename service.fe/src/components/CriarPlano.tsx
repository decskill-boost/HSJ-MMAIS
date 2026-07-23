import { useEffect, useMemo, useState } from "react";
import { exerciciosService, type Exercicio } from "../services/exercicios";
import { useUser } from "../contexts/UserContext";
import { planosService } from "../services/planosService";
import LoadingSpinner from "./LoadingSpinner";

// Mostrar duração como a biblioteca (minutos)
const formatarDuracao = (s: number) =>
  s < 60 ? `${s} seg` : `${Math.round(s / 60)} min`;

// Mostrar dificuldade em texto, como a biblioteca
const textoDificuldade = (d: string) =>
  d === "facil" ? "Fácil" : d === "medio" ? "Médio" : "Difícil";

// Faixas dos filtros (iguais às da biblioteca)
const faixaDificuldade = (d: string) => d;
const faixaDuracao = (s: number) =>
  s <= 300 ? "ate5" : s <= 900 ? "5a15" : "mais15"; // ≤5min / 5–15min / +15min

export const CriarPlano = () => {
  const { user } = useUser();

  const [exercicios, setExercicios] = useState<Exercicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [frequenciaSemanal, setFrequenciaSemanal] = useState(3);
  const [dataValidade, setDataValidade] = useState("");
  const [notasMedicas, setNotasMedicas] = useState("");

  // Planos standard e classificação de intensidade e duração personalizada
  const [tipoPlano, setTipoPlano] = useState<"standard" | "personalizavel">("standard");
  const [condicaoClinica, setCondicaoClinica] = useState("");
  const [dificuldade, setDificuldade] = useState("facil");
  const [condicaoPaciente, setCondicaoPaciente] = useState("A");
  const [duracoesCustomizadas, setDuracoesCustomizadas] = useState<{ [id: string]: number }>({});

  // Estado da gravação
  const [aGuardar, setAGuardar] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [erroGuardar, setErroGuardar] = useState<string | null>(null);

  // Filtros (iguais aos da biblioteca)
  const [filtroCategoria, setFiltroCategoria] = useState("todas");
  const [filtroDificuldade, setFiltroDificuldade] = useState("todas");
  const [filtroCondicao, setFiltroCondicao] = useState("todas");
  const [filtroDuracao, setFiltroDuracao] = useState("todas");

  const limparFiltros = () => {
    setFiltroCategoria("todas");
    setFiltroDificuldade("todas");
    setFiltroCondicao("todas");
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
        filtroCondicao !== "todas" &&
        ex.condicao_paciente !== filtroCondicao
      )
        return false;
      if (
        filtroDuracao !== "todas" &&
        faixaDuracao(ex.duracao_segundos) !== filtroDuracao
      )
        return false;
      return true;
    });
  }, [exercicios, filtroCategoria, filtroDificuldade, filtroCondicao, filtroDuracao]);

  const toggle = (id: string) => {
    setGuardado(false);
    setSelecionados((atual) =>
      atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id],
    );
  };

  const guardar = async () => {
    if (!user) return;
    if (tipoPlano === "personalizavel" && !condicaoClinica.trim()) {
      setErroGuardar("Por favor, especifique a condição clínica para o plano personalizável.");
      return;
    }
    
    setAGuardar(true);
    setErroGuardar(null);
    setGuardado(false);
    try {
      const exerciciosComDuracao = selecionados.map((id) => {
        const ex = exercicios.find((e) => e.id_exercicio === id);
        const durCustom = duracoesCustomizadas[id];
        return {
          id_exercicio: id,
          duracao_segundos: durCustom !== undefined ? durCustom : (ex ? ex.duracao_segundos : 600),
        };
      });

      await planosService.criarPlano({
        id_paciente: null,
        id_medico: user.idUser,
        frequencia_semanal: frequenciaSemanal,
        data_validade: dataValidade
          ? new Date(dataValidade).toISOString()
          : null,
        notas_medicas: notasMedicas,
        is_standard: tipoPlano === "standard",
        dificuldade: dificuldade,
        condicao_paciente: condicaoPaciente,
        condicao_clinica: tipoPlano === "personalizavel" ? condicaoClinica.trim() : null,
        exercicios: exerciciosComDuracao,
      });
      setGuardado(true);
      // limpar depois de guardar
      setSelecionados([]);
      setNotasMedicas("");
      setDuracoesCustomizadas({});
      setFrequenciaSemanal(3);
      setDataValidade("");
      setDificuldade("facil");
      setCondicaoPaciente("A");
      setTipoPlano("standard");
      setCondicaoClinica("");
      setFiltroCategoria("todas");
      setFiltroDificuldade("todas");
      setFiltroDuracao("todas");
    } catch (e) {
      setErroGuardar(
        e instanceof Error ? e.message : "Não foi possível guardar o plano.",
      );
    } finally {
      setAGuardar(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-tinta">
          Criar plano de exercícios
        </h1>
        <p className="mt-1 text-sm text-aco">
          Monte templates de planos de treino gerais ou prescreva planos individuais com durações customizadas.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* COLUNA ESQUERDA: Exercícios & Filtros (Ocupa 2/3) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-tinta/10 bg-papel-claro p-6 shadow-sm">
            <h2 className="text-base font-bold text-tinta mb-4">
              Biblioteca de exercícios
            </h2>

            {/* Filtros */}
            <div className="flex flex-wrap items-end gap-3 mb-6">
              <div className="min-w-[140px] flex-1">
                <label className="block text-xs font-semibold text-aco">
                  Categoria
                </label>
                <select
                  value={filtroCategoria}
                  onChange={(e) => setFiltroCategoria(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-tinta/15 bg-papel px-3 py-2 text-xs text-tinta focus:border-cobalto focus:bg-papel-claro focus:outline-none"
                >
                  <option value="todas">Todas as categorias</option>
                  {categorias.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="min-w-[140px] flex-1">
                <label className="block text-xs font-semibold text-aco">
                  Dificuldade
                </label>
                <select
                  value={filtroDificuldade}
                  onChange={(e) => setFiltroDificuldade(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-tinta/15 bg-papel px-3 py-2 text-xs text-tinta focus:border-cobalto focus:bg-papel-claro focus:outline-none"
                >
                  <option value="todas">Todas as dificuldades</option>
                  <option value="facil">Fácil</option>
                  <option value="medio">Médio</option>
                  <option value="dificil">Difícil</option>
                </select>
              </div>

              <div className="min-w-[140px] flex-1">
                <label className="block text-xs font-semibold text-aco">
                  Condição
                </label>
                <select
                  value={filtroCondicao}
                  onChange={(e) => setFiltroCondicao(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-tinta/15 bg-papel px-3 py-2 text-xs text-tinta focus:border-cobalto focus:bg-papel-claro focus:outline-none"
                >
                  <option value="todas">Todas as condições</option>
                  <option value="A">Nível A</option>
                  <option value="B">Nível B</option>
                  <option value="C">Nível C</option>
                </select>
              </div>

              <div className="min-w-[140px] flex-1">
                <label className="block text-xs font-semibold text-aco">
                  Duração
                </label>
                <select
                  value={filtroDuracao}
                  onChange={(e) => setFiltroDuracao(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-tinta/15 bg-papel px-3 py-2 text-xs text-tinta focus:border-cobalto focus:bg-papel-claro focus:outline-none"
                >
                  <option value="todas">Todas as durações</option>
                  <option value="ate5">Até 5 minutos</option>
                  <option value="5a15">5 a 15 minutos</option>
                  <option value="mais15">Mais de 15 minutos</option>
                </select>
              </div>

              {(filtroCategoria !== "todas" ||
                filtroDificuldade !== "todas" ||
                filtroCondicao !== "todas" ||
                filtroDuracao !== "todas") && (
                <button
                  type="button"
                  onClick={limparFiltros}
                  className="rounded-xl border border-tinta/15 px-4 py-2 text-xs font-semibold text-aco hover:bg-papel focus:outline-none focus:ring-2 focus:ring-tinta/10"
                >
                  Limpar
                </button>
              )}
            </div>

            {/* Scrollable Exercícios List */}
            <div className="max-h-[500px] overflow-y-auto pr-2 space-y-2 border border-tinta/10 rounded-xl p-2 bg-papel/50">
              {loading ? (
                <LoadingSpinner mensagem="A carregar exercícios..." />
              ) : erro ? (
                <p className="text-center text-sm text-capa py-10">
                  {erro}
                </p>
              ) : exerciciosFiltrados.length === 0 ? (
                <p className="text-center text-sm text-aco py-10">
                  Nenhum exercício corresponde a estes filtros.
                </p>
              ) : (
                <ul className="space-y-2">
                  {exerciciosFiltrados.map((ex) => {
                    const ativo = selecionados.includes(ex.id_exercicio);
                    return (
                      <li key={ex.id_exercicio}>
                        <div className={`flex flex-col gap-3 rounded-xl border p-4 bg-papel-claro transition ${ativo ? "border-cobalto/40 bg-cobalto/10" : "border-tinta/15 hover:bg-papel"}`}>
                          <label className="flex cursor-pointer items-start gap-3">
                            <input
                              type="checkbox"
                              checked={ativo}
                              onChange={() => toggle(ex.id_exercicio)}
                              className="mt-1 h-4 w-4 rounded border-tinta/20 text-cobalto focus:ring-cobalto"
                            />
                            <span className="flex-1">
                              <span className="block text-sm font-semibold text-tinta">
                                {ex.nome_exercicio}
                              </span>
                              <span className="block text-xs text-aco">
                                {ex.categoria} · Duração padrão: {formatarDuracao(ex.duracao_segundos)} · Dificuldade: {textoDificuldade(ex.dificuldade_clinica)} · Condição: Nível {ex.condicao_paciente || "A"}
                              </span>
                            </span>
                          </label>
                          
                          {ativo && (
                            <div className="flex items-center gap-3 border-t border-cobalto/20 pt-3">
                              <span className="text-xs font-semibold text-cobalto">Duração customizada:</span>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min={1}
                                  value={Math.round((duracoesCustomizadas[ex.id_exercicio] ?? ex.duracao_segundos) / 60)}
                                  onChange={(e) => {
                                    const mins = Number(e.target.value);
                                    setDuracoesCustomizadas({
                                      ...duracoesCustomizadas,
                                      [ex.id_exercicio]: mins * 60,
                                    });
                                    setGuardado(false);
                                  }}
                                  className="w-16 rounded-lg border border-tinta/15 bg-papel-claro px-2 py-1 text-center text-xs font-bold text-tinta focus:border-cobalto focus:outline-none"
                                />
                                <span className="text-xs text-aco">minutos</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA: Detalhes & Ações (Ocupa 1/3 e é Sticky) */}
        <div className="space-y-6">
          <div className="sticky top-4 rounded-2xl border border-tinta/10 bg-papel-claro p-6 shadow-sm">
            <h2 className="text-base font-bold text-tinta mb-4">
              Configurações do Plano
            </h2>

            <div className="space-y-4">
              {/* Tipo de Plano */}
              <div>
                <label className="block text-xs font-semibold text-aco">Tipo de Plano</label>
                <div className="mt-1 flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-tinta">
                    <input
                      type="radio"
                      name="tipoPlano"
                      value="standard"
                      checked={tipoPlano === "standard"}
                      onChange={() => {
                        setTipoPlano("standard");
                        setGuardado(false);
                      }}
                      className="h-4 w-4 text-cobalto focus:ring-cobalto"
                    />
                    Standard (Geral)
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-tinta">
                    <input
                      type="radio"
                      name="tipoPlano"
                      value="personalizavel"
                      checked={tipoPlano === "personalizavel"}
                      onChange={() => {
                        setTipoPlano("personalizavel");
                        setGuardado(false);
                      }}
                      className="h-4 w-4 text-cobalto focus:ring-cobalto"
                    />
                    Personalizável (Especializado)
                  </label>
                </div>
              </div>

              {/* Condição Clínica (condicional) */}
              {tipoPlano === "personalizavel" && (
                <div>
                  <label className="block text-xs font-semibold text-aco">Condição Clínica / Perfil Destinatário</label>
                  <input
                    type="text"
                    value={condicaoClinica}
                    onChange={(e) => {
                      setCondicaoClinica(e.target.value);
                      setGuardado(false);
                    }}
                    placeholder="Ex: Acamados, Mobilidade Reduzida..."
                    className="mt-1 w-full rounded-xl border border-tinta/15 bg-papel px-3 py-2 text-xs text-tinta focus:border-cobalto focus:bg-papel-claro focus:outline-none focus:ring-2 focus:ring-cobalto/20"
                  />
                </div>
              )}
              {/* Dificuldade do Plano */}
              <div>
                <label className="block text-xs font-semibold text-aco">Classificação de Intensidade</label>
                <select
                  value={dificuldade}
                  onChange={(e) => {
                    setDificuldade(e.target.value);
                    setGuardado(false);
                  }}
                  className="mt-1 w-full rounded-xl border border-tinta/15 bg-papel px-3 py-2.5 text-xs text-tinta focus:border-cobalto focus:bg-papel-claro focus:outline-none focus:ring-2 focus:ring-cobalto/20"
                >
                  <option value="facil">Fácil</option>
                  <option value="medio">Médio</option>
                  <option value="dificil">Difícil</option>
                </select>
              </div>

              {/* Condição do Paciente */}
              <div>
                <label className="block text-xs font-semibold text-aco">Condição do Paciente</label>
                <select
                  value={condicaoPaciente}
                  onChange={(e) => {
                    setCondicaoPaciente(e.target.value);
                    setGuardado(false);
                  }}
                  className="mt-1 w-full rounded-xl border border-tinta/15 bg-papel px-3 py-2.5 text-xs text-tinta focus:border-cobalto focus:bg-papel-claro focus:outline-none focus:ring-2 focus:ring-cobalto/20"
                >
                  <option value="A">Nível A (Baixa Intensidade)</option>
                  <option value="B">Nível B (Média Intensidade)</option>
                  <option value="C">Nível C (Alta Intensidade)</option>
                </select>
              </div>

              {/* Frequência */}
              <div>
                <label className="block text-xs font-semibold text-aco">
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
                  className="mt-1 w-full rounded-xl border border-tinta/15 bg-papel px-3 py-2.5 text-xs text-tinta focus:border-cobalto focus:bg-papel-claro focus:outline-none focus:ring-2 focus:ring-cobalto/20"
                />
              </div>

              {/* Data Validade */}
              <div>
                <label className="block text-xs font-semibold text-aco">
                  Data de validade
                </label>
                <input
                  type="date"
                  value={dataValidade}
                  onChange={(e) => {
                    setDataValidade(e.target.value);
                    setGuardado(false);
                  }}
                  className="mt-1 w-full rounded-xl border border-tinta/15 bg-papel px-3 py-2.5 text-xs text-tinta focus:border-cobalto focus:bg-papel-claro focus:outline-none focus:ring-2 focus:ring-cobalto/20"
                />
              </div>

              {/* Notas médicas */}
              <div>
                <label className="block text-xs font-semibold text-aco">
                  Notas / Indicações do plano
                </label>
                <textarea
                  rows={3}
                  value={notasMedicas}
                  onChange={(e) => {
                    setNotasMedicas(e.target.value);
                    setGuardado(false);
                  }}
                  placeholder="Indicações ou observações para este plano…"
                  className="mt-1 w-full rounded-xl border border-tinta/15 bg-papel px-3 py-2 text-xs text-tinta focus:border-cobalto focus:bg-papel-claro focus:outline-none focus:ring-2 focus:ring-cobalto/20"
                />
              </div>
            </div>

            {/* Sumário */}
            <div className="mt-6 border-t border-tinta/10 pt-4 text-xs text-aco">
              <p className="flex justify-between font-medium">
                <span>Exercícios selecionados:</span>
                <span className="font-bold text-tinta">{selecionados.length}</span>
              </p>
            </div>

            {/* Ações */}
            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={guardar}
                disabled={selecionados.length === 0 || aGuardar}
                className="w-full rounded-xl bg-cobalto px-4 py-3 text-sm font-bold text-papel shadow-sm transition hover:bg-cobalto-vivo focus:outline-none focus:ring-2 focus:ring-cobalto/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {aGuardar ? "A guardar…" : tipoPlano === "standard" ? "Criar plano standard" : "Criar plano personalizável"}
              </button>
            </div>
            {guardado && (
              <p className="mt-3 text-center text-xs font-semibold text-turbo-escuro">
                Plano guardado com sucesso! ✓
              </p>
            )}
            {erroGuardar && (
              <p className="mt-3 rounded-lg bg-capa/10 p-2.5 text-xs font-medium text-capa-escura">
                {erroGuardar}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CriarPlano;
