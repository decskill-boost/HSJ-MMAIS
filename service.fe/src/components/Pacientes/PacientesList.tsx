import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { pacientesService, type PacienteComAdesao } from "../../services/pacientes";

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

const BADGE_STYLES: Record<Exclude<FiltroAdesao, "todos">, string> = {
  critico: "bg-red-100 text-red-700",
  moderado: "bg-amber-100 text-amber-700",
  ideal: "bg-emerald-100 text-emerald-700",
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

  const indicadorOrdenacao = (coluna: Coluna) => {
    if (ordenarPor !== coluna) return null;
    return <span className="ml-1 text-xs">{direcao === "asc" ? "▲" : "▼"}</span>;
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Pacientes</h1>
      <p className="mt-1 text-sm text-slate-500">
        Clica num paciente para ver o seu histórico de assiduidade.
      </p>

      <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        {loading ? (
          <p className="text-sm text-slate-500">A carregar pacientes...</p>
        ) : erro ? (
          <p className="text-sm text-red-600">{erro}</p>
        ) : pacientes.length === 0 ? (
          <p className="text-sm text-slate-500">Ainda não há pacientes registados.</p>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap gap-2">
              {FILTROS.map((f) => (
                <button
                  key={f.valor}
                  type="button"
                  onClick={() => setFiltro(f.valor)}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                    filtro === f.valor
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {pacientesOrdenados.length === 0 ? (
              <p className="text-sm text-slate-500">
                Nenhum paciente encontrado com estes critérios
              </p>
            ) : (
              <div className="overflow-x-auto rounded-3xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th
                        className="cursor-pointer select-none px-4 py-3 font-medium"
                        onClick={() => handleSort("nome")}
                      >
                        Nome{indicadorOrdenacao("nome")}
                      </th>
                      <th
                        className="cursor-pointer select-none px-4 py-3 font-medium"
                        onClick={() => handleSort("email")}
                      >
                        Email{indicadorOrdenacao("email")}
                      </th>
                      <th
                        className="cursor-pointer select-none px-4 py-3 font-medium"
                        onClick={() => handleSort("adesao")}
                      >
                        Adesão{indicadorOrdenacao("adesao")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {pacientesOrdenados.map((paciente) => (
                      <tr
                        key={paciente.idUser}
                        onClick={() => navigate(`/dashboard/medico/pacientes/${paciente.idUser}`)}
                        className="cursor-pointer hover:bg-slate-50"
                      >
                        <td className="px-4 py-4 font-semibold text-slate-900">
                          <Link
                            to={`/dashboard/medico/pacientes/${paciente.idUser}`}
                            className="hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {paciente.nome}
                          </Link>
                        </td>
                        <td className="px-4 py-4 text-slate-600">{paciente.email}</td>
                        <td className="px-4 py-4">
                          {paciente.adesaoPercentual === null ? (
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                              Sem dados
                            </span>
                          ) : (
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                BADGE_STYLES[bucketDeAdesao(paciente.adesaoPercentual)]
                              }`}
                            >
                              {paciente.adesaoPercentual}%
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PacientesList;
