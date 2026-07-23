import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  planosService,
  type PlanoPorPaciente,
} from "../../services/planosService";
import BtnGlobal from "../BtnGlobal";

const formatarData = (data?: string | null) => {
  if (!data) return "-";
  return new Date(data).toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const PlanosCorpoClinico = () => {
  const [planos, setPlanos] = useState<PlanoPorPaciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const navigate = useNavigate();

  const buscarPlanos = async () => {
    try {
      setLoading(true);
      setErro(null);
      const lista = await planosService.getPlanosPorPacientes();
      setPlanos(lista);
    } catch (e) {
      setErro(
        e instanceof Error ? e.message : "Não foi possível carregar os planos.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void buscarPlanos();
  }, []);

  const totalPlanosAtivos = useMemo(
    () =>
      planos.reduce(
        (total, paciente) =>
          total + paciente.planos.filter((plano) => plano.ativo).length,
        0,
      ),
    [planos],
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      {/* Cabeçalho: empilhado em mobile, em linha a partir de sm */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-tinta">
            Gestão de planos clínicos
          </h1>
          <p className="mt-1 text-sm text-aco">
            Veja todos os pacientes, o plano atual e assinale novos planos
            quando necessário.
          </p>
        </div>
        <BtnGlobal
          onClick={() => navigate("/plano/criar")}
          className="w-full rounded-xl bg-cobalto px-4 py-3 text-sm text-papel hover:bg-cobalto sm:w-auto"
        >
          Criar plano novo
        </BtnGlobal>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-tinta/15 bg-papel-claro p-5 shadow-sm">
        <div>
          <p className="text-sm font-semibold text-aco">
            Pacientes listados
          </p>
          <p className="mt-1 text-2xl font-bold text-tinta">
            {planos.length}
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-aco">Planos ativos</p>
          <p className="mt-1 text-2xl font-bold text-tinta">
            {totalPlanosAtivos}
          </p>
        </div>
      </div>

      {erro && (
        <div className="mb-6 rounded-2xl bg-capa/10 p-4 text-sm text-capa-escura">
          {erro}
        </div>
      )}

      <div className="overflow-x-auto rounded-3xl border border-tinta/15 bg-papel-claro shadow-sm">
        <table className="min-w-full divide-y divide-tinta/15 text-left text-sm">
          <thead className="bg-papel text-aco">
            <tr>
              <th className="px-6 py-4 font-semibold">Criança</th>
              <th className="px-4 py-4 font-semibold">Planos Ativos</th>
              <th className="px-4 py-4 font-semibold">Planos Totais</th>
              <th className="px-4 py-4 font-semibold">Início Paciente</th>
              <th className="px-6 py-4 font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-tinta/10">
            {loading ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-8 text-center text-sm text-aco"
                >
                  A carregar pacientes e planos…
                </td>
              </tr>
            ) : planos.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-8 text-center text-sm text-aco"
                >
                  Nenhum paciente encontrado.
                </td>
              </tr>
            ) : (
              planos.map((paciente) => {
                const planosAtivos = paciente.planos.filter((p) => p.ativo);
                const planosTotais = paciente.planos.length;
                const planoMaisRecente =
                  planosAtivos[0] ?? paciente.planos[0] ?? null;
                const temPlanoAtivo = planosAtivos.length > 0;

                return (
                  <tr key={paciente.id_paciente} className="hover:bg-papel">
                    <td className="px-6 py-4 font-semibold text-tinta">
                      {paciente.nome}
                    </td>

                    {/* Planos Ativos */}
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                          temPlanoAtivo
                            ? "bg-turbo/10 text-turbo-escuro ring-turbo-escuro/10"
                            : "bg-papel text-aco ring-aco/10"
                        }`}
                      >
                        {planosAtivos.length}{" "}
                        {planosAtivos.length === 1 ? "ativo" : "ativos"}
                      </span>
                    </td>

                    {/* Planos Totais */}
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center rounded-md bg-papel px-2 py-1 text-xs font-medium text-aco ring-1 ring-inset ring-aco/10">
                        {planosTotais} {planosTotais === 1 ? "total" : "totais"}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-tinta">
                      {formatarData(
                        (paciente as any).data_criacao ??
                          planoMaisRecente?.data_inicio,
                      )}
                    </td>

                    {/* Ações — alinhadas à esquerda, empilham em ecrãs muito pequenos */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:whitespace-nowrap">
                        <BtnGlobal
                          onClick={() =>
                            navigate(
                              `/plano/criar?paciente=${paciente.id_paciente}`,
                            )
                          }
                          className="rounded-xl bg-tinta px-3 py-2 text-xs text-papel hover:bg-tinta"
                        >
                          Atribuir novo plano
                        </BtnGlobal>

                        <BtnGlobal
                          variant="secondary"
                          onClick={() =>
                            navigate(
                              `/dashboard/medico/pacientes/${paciente.id_paciente}`,
                            )
                          }
                          className="rounded-xl border border-tinta/15 bg-papel-claro px-3 py-2 text-xs font-semibold text-tinta hover:bg-papel"
                        >
                          Ir para detalhados
                        </BtnGlobal>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PlanosCorpoClinico;
