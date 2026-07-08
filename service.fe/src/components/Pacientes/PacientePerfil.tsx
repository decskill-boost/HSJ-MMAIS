import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  pacientesService,
  type HistoricoResposta,
  type PacienteDetalhe,
} from "../../services/pacientes";
import HistoricoCalendario from "./HistoricoCalendario";

const PacientePerfil = () => {
  const { idPaciente } = useParams<{ idPaciente: string }>();
  const [paciente, setPaciente] = useState<PacienteDetalhe | null>(null);
  const [historico, setHistorico] = useState<HistoricoResposta | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!idPaciente) return;
    Promise.all([
      pacientesService.getPacienteById(idPaciente),
      pacientesService.getHistorico(idPaciente),
    ])
      .then(([dadosPaciente, dadosHistorico]) => {
        setPaciente(dadosPaciente);
        setHistorico(dadosHistorico);
      })
      .catch((err) => setErro(err.message))
      .finally(() => setLoading(false));
  }, [idPaciente]);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-10">
        <p className="text-sm text-slate-500">A carregar perfil do paciente...</p>
      </div>
    );
  }

  if (erro || !paciente) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-10">
        <p className="text-sm text-red-600">{erro ?? "Paciente não encontrado."}</p>
        <Link
          to="/dashboard/medico/adesao"
          className="mt-4 inline-block text-sm text-blue-600 hover:underline"
        >
          ← Voltar à lista de pacientes
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <Link
        to="/dashboard/medico/adesao"
        className="text-sm font-medium text-slate-500 transition hover:text-slate-900"
      >
        ← Voltar à lista de pacientes
      </Link>

      <section className="mt-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              {paciente.nome}
            </h1>
            <p className="mt-1 text-sm text-slate-500">{paciente.email}</p>
          </div>
          <div className="flex gap-6 text-center">
            <div>
              <p className="text-2xl font-bold text-slate-900">{paciente.nivel}</p>
              <p className="text-xs uppercase tracking-wide text-slate-400">Nível</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{paciente.xp}</p>
              <p className="text-xs uppercase tracking-wide text-slate-400">XP</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{paciente.streak_atual}</p>
              <p className="text-xs uppercase tracking-wide text-slate-400">Sequência</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Histórico de assiduidade</h2>
        <p className="mt-1 text-sm text-slate-500">
          Dias em que os exercícios foram concluídos, falhados ou ignorados.
        </p>
        {historico && <HistoricoCalendario historico={historico} />}
      </section>
    </div>
  );
};

export default PacientePerfil;
