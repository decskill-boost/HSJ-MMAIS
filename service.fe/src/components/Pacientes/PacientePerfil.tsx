import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  pacientesService,
  type HistoricoResposta,
  type PacienteDetalhe,
} from "../../services/pacientes";
import HistoricoCalendario from "./HistoricoCalendario";

const RECOMPENSAS = [
  { id: "diploma", nome: "Diploma de Iniciante", xpNecessario: 100, icone: "🎓", desc: "Atingir 100 XP (Nível 2)" },
  { id: "super_atleta", nome: "Super Atleta", xpNecessario: 300, icone: "⚡", desc: "Atingir 300 XP (Nível 3)" },
  { id: "campeao_mmais", nome: "Campeão MMAIS", xpNecessario: 600, icone: "🛡️", desc: "Atingir 600 XP (Nível 4)" },
  { id: "lenda_hospital", nome: "Lenda do Hospital", xpNecessario: 1000, icone: "🏆", desc: "Atingir 1000 XP (Nível 5)" },
];

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
        <p className="text-sm text-aco">A carregar perfil do paciente...</p>
      </div>
    );
  }

  if (erro || !paciente) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-10">
        <p className="text-sm text-capa-escura">{erro ?? "Paciente não encontrado."}</p>
        <Link
          to="/dashboard/medico/adesao"
          className="mt-4 inline-block text-sm text-cobalto hover:underline"
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
        className="text-sm font-medium text-aco transition hover:text-tinta"
      >
        ← Voltar à lista de pacientes
      </Link>

      <section className="mt-4 rounded-3xl border border-tinta/15 bg-papel-claro p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-tinta">
              {paciente.nome}
            </h1>
            <p className="mt-1 text-sm text-aco">{paciente.email}</p>
          </div>
          <div className="flex gap-6 text-center">
            <div>
              <p className="text-2xl font-bold text-tinta">{paciente.nivel}</p>
              <p className="text-xs uppercase tracking-wide text-aco">Nível</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-tinta">{paciente.xp}</p>
              <p className="text-xs uppercase tracking-wide text-aco">XP</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-tinta">{paciente.streak_atual}</p>
              <p className="text-xs uppercase tracking-wide text-aco">Sequência</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-tinta/15 bg-papel-claro p-6 shadow-sm">
        <h2 className="text-lg font-bold text-tinta">Recompensas e Conquistas</h2>
        <p className="mt-1 text-sm text-aco">
          Progresso de prémios da criança com base no XP acumulado ({paciente.xp} XP total).
        </p>
        <div className="mt-4 grid gap-4 grid-cols-2 sm:grid-cols-4">
          {RECOMPENSAS.map((rec) => {
            const desbloqueada = paciente.xp >= rec.xpNecessario;
            return (
              <div
                key={rec.id}
                className={`rounded-2xl border p-4 text-center transition ${desbloqueada ? "border-turbo/30 bg-turbo/10/50" : "border-tinta/10 bg-papel/50 opacity-60"}`}
              >
                <span className="text-3xl block mb-2">{rec.icone}</span>
                <p className="font-bold text-xs sm:text-sm text-tinta leading-tight">{rec.nome}</p>
                <p className="text-[10px] text-aco mt-1">{rec.desc}</p>
                <span
                  className={`inline-block mt-3 rounded-full px-2 py-0.5 text-[9px] font-bold ${desbloqueada ? "bg-turbo/20 text-turbo-escuro" : "bg-tinta/15 text-aco"}`}
                >
                  {desbloqueada ? "Desbloqueado ✓" : "Bloqueado 🔒"}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-tinta/15 bg-papel-claro p-6 shadow-sm">
        <h2 className="text-lg font-bold text-tinta">Histórico de assiduidade</h2>
        <p className="mt-1 text-sm text-aco">
          Dias em que os exercícios foram concluídos, falhados ou ignorados.
        </p>
        {historico && <HistoricoCalendario historico={historico} />}
      </section>
    </div>
  );
};

export default PacientePerfil;
