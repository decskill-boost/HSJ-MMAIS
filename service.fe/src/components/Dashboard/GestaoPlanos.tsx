import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "../LoadingSpinner";
import { planosService, type PlanoGerido } from "../../services/planosService";

type Filtro = "todos" | "standard" | "prescritos" | "cancelados";

const textoDificuldade = (d: string) =>
  d === "facil" ? "Fácil" : d === "medio" ? "Médio" : "Difícil";

const formatarData = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("pt-PT") : "—";

const GestaoPlanos = () => {
  const navigate = useNavigate();
  const [planos, setPlanos] = useState<PlanoGerido[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [pesquisa, setPesquisa] = useState("");
  const [aProcessar, setAProcessar] = useState<string | null>(null);
  const [confirmarEliminar, setConfirmarEliminar] = useState<string | null>(null);

  const carregar = async () => {
    try {
      setLoading(true);
      setErro(null);
      setPlanos(await planosService.getTodosOsPlanos());
    } catch (e) {
      setErro(
        e instanceof Error ? e.message : "Não foi possível carregar os planos.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void carregar();
  }, []);

  const visiveis = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase();
    return planos.filter((p) => {
      if (filtro === "standard" && !(p.is_standard && p.ativo)) return false;
      if (filtro === "prescritos" && !(!p.is_standard && p.ativo)) return false;
      if (filtro === "cancelados" && p.ativo) return false;
      if (filtro === "todos" && !p.ativo) return false;
      if (!termo) return true;
      return (
        (p.nome_paciente ?? "").toLowerCase().includes(termo) ||
        (p.notas_medicas ?? "").toLowerCase().includes(termo)
      );
    });
  }, [planos, filtro, pesquisa]);

  const cancelar = async (id: string) => {
    setAProcessar(id);
    try {
      await planosService.cancelPlano(id);
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível cancelar.");
    } finally {
      setAProcessar(null);
    }
  };

  const eliminar = async (id: string) => {
    setAProcessar(id);
    try {
      await planosService.eliminarPlano(id);
      setConfirmarEliminar(null);
      await carregar();
    } catch (e) {
      setErro(
        e instanceof Error
          ? e.message
          : "Não foi possível eliminar. O plano pode já ter treinos associados.",
      );
    } finally {
      setAProcessar(null);
    }
  };

  const filtros: { chave: Filtro; label: string }[] = [
    { chave: "todos", label: "Ativos" },
    { chave: "standard", label: "Standard" },
    { chave: "prescritos", label: "Prescritos" },
    { chave: "cancelados", label: "Cancelados" },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Cabeçalho sóbrio do QG clínico */}
      <div className="mb-6 rounded-(--radius-vinheta) border-[3px] border-tinta bg-papel-claro p-6 shadow-vinheta">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cobalto">
              Prescrição
            </p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-tinta">
              Planos criados
            </h1>
            <p className="mt-1 text-sm text-aco">
              {loading
                ? "A carregar…"
                : `${visiveis.length} ${visiveis.length === 1 ? "plano" : "planos"}`}
            </p>
          </div>
          <button
            onClick={() => navigate("/plano/criar")}
            className="flex items-center gap-2 rounded-(--radius-vinheta) border-[3px] border-tinta bg-cobalto px-4 py-2.5 text-sm font-bold text-papel shadow-vinheta transition hover:bg-cobalto-vivo active:scale-95 active:shadow-none"
          >
            <span className="text-lg leading-none">+</span> Criar plano
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-tinta/15 pt-5">
          <div className="flex flex-wrap gap-2">
            {filtros.map((f) => (
              <button
                key={f.chave}
                onClick={() => setFiltro(f.chave)}
                className={`rounded-xl border-2 border-tinta px-4 py-2 text-sm font-bold transition active:scale-95 ${
                  filtro === f.chave
                    ? "bg-cobalto text-papel"
                    : "bg-papel-claro text-tinta hover:bg-papel"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <input
            type="search"
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            placeholder="Pesquisar por paciente ou notas…"
            className="min-w-[220px] flex-1 rounded-xl border border-tinta/15 bg-papel-claro px-4 py-2 text-sm text-tinta placeholder:text-aco focus:border-cobalto focus:outline-none focus:ring-2 focus:ring-cobalto/20"
          />
        </div>
      </div>

      {erro && (
        <div className="mb-4 rounded-2xl border-2 border-capa/30 bg-capa/10 p-4 text-sm font-medium text-capa-escura">
          {erro}
        </div>
      )}

      {loading ? (
        <LoadingSpinner mensagem="A carregar planos..." />
      ) : visiveis.length === 0 ? (
        <div className="rounded-(--radius-vinheta) border-[3px] border-tinta bg-papel-claro p-8 text-center shadow-vinheta">
          <p className="text-aco">
            {pesquisa
              ? `Nenhum plano encontrado para "${pesquisa}".`
              : "Ainda não há planos nesta vista."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {visiveis.map((p) => (
            <article
              key={p.id_plano}
              className={`rounded-(--radius-vinheta) border-[3px] border-tinta bg-papel-claro p-5 shadow-vinheta ${
                p.ativo ? "" : "opacity-70"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full border-2 border-tinta px-2.5 py-0.5 text-xs font-bold ${
                        p.is_standard
                          ? "bg-raio text-tinta"
                          : "bg-cobalto text-papel"
                      }`}
                    >
                      {p.is_standard ? "Standard" : "Prescrito"}
                    </span>
                    {!p.ativo && (
                      <span className="rounded-full border-2 border-tinta bg-capa-escura px-2.5 py-0.5 text-xs font-bold text-papel">
                        Cancelado
                      </span>
                    )}
                  </div>
                  <h2 className="mt-2 truncate text-lg font-bold text-tinta">
                    {p.is_standard
                      ? "Modelo geral"
                      : (p.nome_paciente ?? "Paciente")}
                  </h2>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
                <span className="rounded-full border border-tinta/15 bg-papel px-2 py-1 font-semibold text-aco">
                  {p.total_exercicios}{" "}
                  {p.total_exercicios === 1 ? "exercício" : "exercícios"}
                </span>
                <span className="rounded-full border border-tinta/15 bg-papel px-2 py-1 font-semibold text-aco">
                  {textoDificuldade(p.dificuldade)}
                </span>
                <span className="rounded-full border border-cobalto/25 bg-cobalto/10 px-2 py-1 font-semibold text-cobalto">
                  Cond. {p.condicao_paciente}
                </span>
                <span className="rounded-full border border-tinta/15 bg-papel px-2 py-1 font-semibold text-aco">
                  {p.frequencia_semanal}x/semana
                </span>
                <span className="rounded-full border border-tinta/15 bg-papel px-2 py-1 font-semibold text-aco">
                  Validade: {formatarData(p.data_validade)}
                </span>
              </div>

              {p.notas_medicas && (
                <p className="mt-3 line-clamp-2 rounded-xl border border-tinta/15 bg-papel p-2.5 text-xs italic text-aco">
                  {p.notas_medicas}
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-2 border-t border-tinta/15 pt-4">
                <button
                  onClick={() =>
                    navigate(`/plano/criar?editar=${p.id_plano}`)
                  }
                  className="rounded-xl border-2 border-tinta bg-papel-claro px-4 py-2 text-xs font-bold text-tinta transition hover:bg-papel active:scale-95"
                >
                  Editar
                </button>
                {p.ativo && (
                  <button
                    onClick={() => cancelar(p.id_plano)}
                    disabled={aProcessar === p.id_plano}
                    className="rounded-xl border-2 border-tinta bg-papel-claro px-4 py-2 text-xs font-bold text-tinta transition hover:bg-papel active:scale-95 disabled:opacity-50"
                  >
                    {aProcessar === p.id_plano ? "A cancelar…" : "Cancelar"}
                  </button>
                )}
                {confirmarEliminar === p.id_plano ? (
                  <>
                    <button
                      onClick={() => eliminar(p.id_plano)}
                      disabled={aProcessar === p.id_plano}
                      className="rounded-xl border-2 border-tinta bg-capa-escura px-4 py-2 text-xs font-bold text-papel transition hover:brightness-110 active:scale-95 disabled:opacity-50"
                    >
                      Confirmar eliminação
                    </button>
                    <button
                      onClick={() => setConfirmarEliminar(null)}
                      className="rounded-xl border-2 border-tinta/30 px-4 py-2 text-xs font-bold text-aco transition hover:bg-papel"
                    >
                      Voltar atrás
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setConfirmarEliminar(p.id_plano)}
                    className="rounded-xl border-2 border-capa/40 bg-capa/10 px-4 py-2 text-xs font-bold text-capa-escura transition hover:bg-capa/20 active:scale-95"
                  >
                    Eliminar
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default GestaoPlanos;
