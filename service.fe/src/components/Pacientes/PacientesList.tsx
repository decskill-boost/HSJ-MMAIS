import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { pacientesService, type PacienteComAdesao } from "../../services/pacientes";
import LoadingSpinner from "../LoadingSpinner";
import EstadoVazio from "../ui/EstadoVazio";
import {
  CabecaTabela,
  CorpoTabela,
  LinhaMensagem,
  Tabela,
  ThOrdenavel,
} from "../ui/Tabela";

type FiltroAdesao = "todos" | "critico" | "moderado" | "ideal";
type Coluna = "nome" | "email" | "adesao";
type Direcao = "asc" | "desc";

function bucketDeAdesao(percentual: number): Exclude<FiltroAdesao, "todos"> {
  if (percentual < 50) return "critico";
  if (percentual <= 80) return "moderado";
  return "ideal";
}

const FILTROS: { valor: FiltroAdesao; label: string }[] = [
  { valor: "todos", label: "Todos" },
  { valor: "critico", label: "Crítico (<50%)" },
  { valor: "moderado", label: "Moderado (50-80%)" },
  { valor: "ideal", label: "Ideal (>80%)" },
];

// Contraste verificado sobre papel: o «moderado» era amarelo sobre amarelo.
const BADGE_STYLES: Record<Exclude<FiltroAdesao, "todos">, string> = {
  critico: "border-capa bg-capa/20 text-capa-escura",
  moderado: "border-raio-fundo bg-raio/40 text-tinta",
  ideal: "border-turbo bg-turbo/20 text-turbo-escuro",
};

const PacientesList = () => {
  const navigate = useNavigate();
  const [pacientes, setPacientes] = useState<PacienteComAdesao[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<FiltroAdesao>("todos");
  const [ordenarPor, setOrdenarPor] = useState<Coluna>("nome");
  const [direcao, setDirecao] = useState<Direcao>("asc");

  useEffect(() => {
    pacientesService
      .getPacientesComAdesao()
      .then(setPacientes)
      .catch((err) => setErro(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSort = (coluna: Coluna) => {
    if (ordenarPor === coluna) {
      setDirecao((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setOrdenarPor(coluna);
      setDirecao("asc");
    }
  };

  const pacientesFiltrados = useMemo(() => {
    if (filtro === "todos") return pacientes;
    return pacientes.filter(
      (p) => p.adesaoPercentual !== null && bucketDeAdesao(p.adesaoPercentual) === filtro,
    );
  }, [pacientes, filtro]);

  const pacientesOrdenados = useMemo(() => {
    const copia = [...pacientesFiltrados];
    copia.sort((a, b) => {
      if (ordenarPor === "adesao") {
        if (a.adesaoPercentual === null && b.adesaoPercentual === null) return 0;
        if (a.adesaoPercentual === null) return 1;
        if (b.adesaoPercentual === null) return -1;
        const resultado = a.adesaoPercentual - b.adesaoPercentual;
        return direcao === "asc" ? resultado : -resultado;
      }
      const resultado = a[ordenarPor].localeCompare(b[ordenarPor]);
      return direcao === "asc" ? resultado : -resultado;
    });
    return copia;
  }, [pacientesFiltrados, ordenarPor, direcao]);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <h1 className="font-display text-3xl tracking-wide text-tinta">Pacientes</h1>
      <p className="mt-1 text-sm text-aco">
        Clica num paciente para ver o seu histórico de assiduidade.
      </p>

      {loading ? (
        <div className="painel mt-6">
          <LoadingSpinner mensagem="A carregar pacientes..." />
        </div>
      ) : erro ? (
        <p className="painel mt-6 border-capa p-6 text-sm font-bold text-capa-escura" role="alert">
          {erro}
        </p>
      ) : pacientes.length === 0 ? (
        <div className="painel mt-6">
          <EstadoVazio
            titulo="Ainda não há pacientes"
            descricao="Assim que houver crianças inscritas na Academia, aparecem aqui com a sua adesão."
          />
        </div>
      ) : (
        <>
          <div
            className="mt-6 flex flex-wrap gap-2"
            role="group"
            aria-label="Filtrar por nível de adesão"
          >
            {FILTROS.map((f) => (
              <button
                key={f.valor}
                type="button"
                aria-pressed={filtro === f.valor}
                onClick={() => setFiltro(f.valor)}
                className={`min-h-11 rounded-(--radius-vinheta) border-2 border-tinta px-4 text-xs font-bold transition-colors ${
                  filtro === f.valor
                    ? "bg-tinta text-papel"
                    : "bg-papel-claro text-tinta hover:bg-raio/25"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <Tabela
            legenda="Pacientes e respetiva adesão aos planos"
            className="mt-4"
          >
            <CabecaTabela>
              <tr>
                <ThOrdenavel
                  ativa={ordenarPor === "nome"}
                  direcao={direcao}
                  onOrdenar={() => handleSort("nome")}
                >
                  Nome
                </ThOrdenavel>
                <ThOrdenavel
                  ativa={ordenarPor === "email"}
                  direcao={direcao}
                  onOrdenar={() => handleSort("email")}
                >
                  Email
                </ThOrdenavel>
                <ThOrdenavel
                  ativa={ordenarPor === "adesao"}
                  direcao={direcao}
                  onOrdenar={() => handleSort("adesao")}
                >
                  Adesão
                </ThOrdenavel>
              </tr>
            </CabecaTabela>
            <CorpoTabela>
              {pacientesOrdenados.length === 0 ? (
                <LinhaMensagem colunas={3}>
                  <EstadoVazio
                    titulo="Nenhum paciente neste filtro"
                    descricao="Experimenta «Todos» para ver a lista completa."
                  />
                </LinhaMensagem>
              ) : (
                pacientesOrdenados.map((paciente) => (
                  <tr
                    key={paciente.idUser}
                    onClick={() => navigate(`/dashboard/medico/adesao/${paciente.idUser}`)}
                    className="cursor-pointer transition-colors hover:bg-raio/15"
                  >
                    <td className="px-4 py-4 font-bold text-tinta">
                      <Link
                        to={`/dashboard/medico/adesao/${paciente.idUser}`}
                        className="hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {paciente.nome}
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-aco">{paciente.email}</td>
                    <td className="px-4 py-4">
                      {paciente.adesaoPercentual === null ? (
                        <span className="inline-flex rounded-full border-2 border-tinta/20 bg-papel px-3 py-1 text-xs font-bold text-aco">
                          Sem dados
                        </span>
                      ) : (
                        <span
                          className={`inline-flex rounded-full border-2 px-3 py-1 text-xs font-bold ${
                            BADGE_STYLES[bucketDeAdesao(paciente.adesaoPercentual)]
                          }`}
                        >
                          {paciente.adesaoPercentual}%
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </CorpoTabela>
          </Tabela>
        </>
      )}
    </div>
  );
};

export default PacientesList;
