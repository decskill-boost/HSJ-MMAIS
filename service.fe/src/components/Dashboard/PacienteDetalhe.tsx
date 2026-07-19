import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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

const PacienteDetalhe = () => {
  const { pacienteId } = useParams<{ pacienteId: string }>();
  const navigate = useNavigate();
  const [paciente, setPaciente] = useState<PlanoPorPaciente | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  const carregar = async () => {
    if (!pacienteId) return;

    try {
      setLoading(true);
      setErro(null);
      const dados = await planosService.getPlanosPorPaciente(pacienteId);
      setPaciente(dados);
    } catch (err) {
      setErro(
        err instanceof Error ? err.message : "Erro ao carregar o paciente.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void carregar();
  }, [pacienteId]);

  const handleCancelarPlano = async (idPlano: string) => {
    if (!window.confirm("Deseja cancelar este plano?")) return;

    try {
      setCancellingId(idPlano);
      setSucesso(false);
      await planosService.cancelPlano(idPlano);
      setSucesso(true);
      await carregar();
    } catch (err) {
      setErro(
        err instanceof Error
          ? err.message
          : "Não foi possível cancelar o plano.",
      );
    } finally {
      setCancellingId(null);
    }
  };

  const planosAtivos = useMemo(
    () => paciente?.planos.filter((p) => p.ativo) ?? [],
    [paciente],
  );

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <p className="text-aco">A carregar detalhes do paciente...</p>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="rounded-2xl bg-capa/10 p-4 text-capa-escura">{erro}</div>
      </div>
    );
  }

  if (!paciente) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="rounded-2xl bg-papel p-6 shadow-sm">
          <p className="text-tinta">Paciente não encontrado.</p>
          <BtnGlobal
            onClick={() => navigate("/dashboard/medico/pacientes")}
            className="mt-4 rounded-xl bg-tinta px-4 py-2 text-sm font-semibold text-papel hover:bg-tinta"
          >
            Voltar para lista
          </BtnGlobal>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-tinta">
            {paciente.nome}
          </h1>
          <p className="mt-1 text-sm text-aco">
            Detalhe de planos para este paciente.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <BtnGlobal
            onClick={() =>
              navigate(`/plano/criar?paciente=${paciente.id_paciente}`)
            }
            className="rounded-xl bg-cobalto px-4 py-3 text-sm text-papel hover:bg-cobalto"
          >
            Atribuir novo plano
          </BtnGlobal>
          <BtnGlobal
            onClick={() => navigate("/dashboard/medico/pacientes")}
            className="rounded-xl bg-tinta px-4 py-3 text-sm text-papel hover:bg-tinta"
          >
            Voltar para lista
          </BtnGlobal>
        </div>
      </div>

      {sucesso && (
        <div className="mb-6 rounded-2xl bg-turbo/10 p-4 text-sm text-turbo-escuro">
          Plano cancelado com sucesso.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <article className="rounded-3xl border border-tinta/15 bg-papel-claro p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-aco">
            Planos ativos
          </p>
          <p className="mt-4 text-3xl font-bold text-tinta">
            {planosAtivos.length}
          </p>
          <p className="mt-2 text-sm text-aco">
            Planos com status ativo hoje.
          </p>
        </article>
        <article className="rounded-3xl border border-tinta/15 bg-papel-claro p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-aco">
            Planos totais
          </p>
          <p className="mt-4 text-3xl font-bold text-tinta">
            {paciente.planos.length}
          </p>
          <p className="mt-2 text-sm text-aco">
            Inclui ativos e inativos.
          </p>
        </article>
        <article className="rounded-3xl border border-tinta/15 bg-papel-claro p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-aco">
            Último início
          </p>
          <p className="mt-4 text-3xl font-bold text-tinta">
            {formatarData(paciente.planos[0]?.data_inicio)}
          </p>
          <p className="mt-2 text-sm text-aco">
            Data do plano mais recente.
          </p>
        </article>
      </div>

      <div className="mt-8 overflow-x-auto rounded-3xl border border-tinta/15 bg-papel-claro shadow-sm">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="bg-papel text-aco">
            <tr>
              <th className="px-4 py-4 font-semibold">Plano</th>
              <th className="px-4 py-4 font-semibold">Início</th>
              <th className="px-4 py-4 font-semibold">Validade</th>
              <th className="px-4 py-4 font-semibold">Status</th>
              <th className="px-4 py-4 font-semibold">Notas</th>
              <th className="px-4 py-4 font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody>
            {paciente.planos.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-sm text-aco"
                >
                  Nenhum plano atribuído a este paciente.
                </td>
              </tr>
            ) : (
              paciente.planos.map((plano) => (
                <tr
                  key={plano.id_plano}
                  className="border-t border-tinta/15 last:border-b"
                >
                  <td className="px-4 py-4">
                    <p className="font-semibold text-tinta">
                      {plano.frequencia_semanal}x/semana
                    </p>
                  </td>
                  <td className="px-4 py-4 text-tinta">
                    {formatarData(plano.data_inicio)}
                  </td>
                  <td className="px-4 py-4 text-tinta">
                    {formatarData(plano.data_validade)}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${plano.ativo ? "bg-turbo/20 text-turbo-escuro" : "bg-tinta/10 text-aco"}`}
                    >
                      {plano.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-aco">
                    {plano.notas_medicas ?? "Sem notas médicas."}
                  </td>
                  <td className="px-4 py-4">
                    {plano.ativo ? (
                      <button
                        type="button"
                        onClick={() => handleCancelarPlano(plano.id_plano)}
                        disabled={cancellingId === plano.id_plano}
                        className="rounded-xl border border-capa/30 bg-capa/10 px-3 py-2 text-xs font-semibold text-capa-escura transition hover:bg-capa/20 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {cancellingId === plano.id_plano
                          ? "A cancelar…"
                          : "Cancelar"}
                      </button>
                    ) : (
                      <span className="text-xs italic text-aco">
                        Sem ações
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PacienteDetalhe;
