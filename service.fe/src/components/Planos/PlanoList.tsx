import type { PlanoAtivo, ExercicioDoPlano } from "../../services/planosService";
import { useState } from "react";

interface Props {
  planoAtivo: PlanoAtivo | null;
  historico: PlanoAtivo[];
  loading: boolean;
  onSelecionarExercicio: (ex: ExercicioDoPlano) => void;
}

const getDificuldadeLabel = (value: number) => {
  if (value <= 3) return "Fácil";
  if (value <= 6) return "Médio";
  return "Difícil";
};

const getDificuldadeColor = (value: number) => {
  if (value <= 3) return "bg-turbo/15 text-turbo-escuro";
  if (value <= 6) return "bg-raio/25 text-raio-fundo";
  return "bg-capa/20 text-capa-escura";
};

const PlanoList = ({ planoAtivo, historico, loading, onSelecionarExercicio }: Props) => {
  const [mostrarHistorico, setMostrarHistorico] = useState(false);

  if (loading) {
    return <p className="mt-10 text-sm text-aco">A carregar planos...</p>;
  }

  return (
    <div className="mt-8 flex flex-col gap-8">
      {/* PLANO ATIVO */}
      <section>
        <div className="mb-4 flex items-center gap-3">
          <h2 className="text-lg font-bold text-tinta">Plano ativo</h2>
          <span className="rounded-full bg-turbo/20 px-3 py-0.5 text-xs font-semibold text-turbo-escuro">
            Atual
          </span>
        </div>

        {!planoAtivo ? (
          <div className="rounded-2xl border border-tinta/15 bg-papel-claro p-8 text-center">
            <p className="text-aco">Ainda não tens um plano ativo atribuído.</p>
            <p className="mt-1 text-sm text-aco">
              O teu médico ainda não criou um plano para ti.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-tinta/15 bg-papel-claro p-5 shadow-sm">
            {planoAtivo.notas_medicas && (
              <div className="mb-4 rounded-xl border border-cobalto/15 bg-cobalto/10 px-4 py-2 text-sm text-cobalto-vivo">
                <span className="font-semibold">Nota do médico: </span>
                {planoAtivo.notas_medicas}
              </div>
            )}
            <p className="mb-4 text-sm text-aco">
              Frequência:{" "}
              <span className="font-semibold text-tinta">
                {planoAtivo.frequencia_semanal}x por semana
              </span>
            </p>

            <div className="flex flex-col gap-4">
              {planoAtivo.exercicios.map((ex) => (
                <button
                  key={ex.id_exercicio}
                  onClick={() => onSelecionarExercicio(ex)}
                  className="flex items-center gap-4 rounded-2xl border border-tinta/15 bg-papel-claro p-3 text-left shadow-sm transition hover:border-cobalto/40 hover:shadow-md"
                >
                  <div className="relative h-24 w-36 flex-shrink-0 overflow-hidden rounded-xl bg-tinta/10">
                    {ex.url_video ? (
                      <video
                        src={`${ex.url_video}#t=0.1`}
                        className="h-full w-full object-cover"
                        preload="metadata"
                        muted
                        playsInline
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-tinta/20">
                        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-1.5">
                    <p className="font-bold text-tinta">{ex.nome_exercicio}</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-aco">
                      <span>⏱ {Math.floor(ex.duracao_segundos / 60)} min</span>
                      <span className="text-tinta/20">·</span>
                      <span className={`rounded-full px-2 py-0.5 font-semibold ${getDificuldadeColor(ex.dificuldade_clinica)}`}>
                        {getDificuldadeLabel(ex.dificuldade_clinica)}
                      </span>
                      <span className="text-tinta/20">·</span>
                      <span className="font-medium text-cobalto">+{ex.recompensa_xp} XP</span>
                    </div>
                  </div>
                  <span className="ml-2 text-xl text-tinta/20">→</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* HISTÓRICO */}
      {historico.length > 0 && (
        <section>
          <button
            onClick={() => setMostrarHistorico((v) => !v)}
            className="flex items-center gap-2 text-sm font-semibold text-aco transition hover:text-tinta"
          >
            <span>{mostrarHistorico ? "▾" : "▸"}</span>
            Histórico de planos ({historico.length})
          </button>

          {mostrarHistorico && (
            <div className="mt-4 flex flex-col gap-6">
              {historico.map((plano, i) => (
                <div key={plano.id_plano} className="rounded-2xl border border-tinta/15 bg-papel-claro p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <span className="text-sm font-bold text-aco">
                      Plano anterior #{historico.length - i}
                    </span>
                    <span className="rounded-full bg-tinta/10 px-2 py-0.5 text-xs text-aco">
                      Inativo
                    </span>
                    <span className="ml-auto text-xs text-aco">
                      {plano.frequencia_semanal}x por semana
                    </span>
                  </div>

                  {plano.notas_medicas && (
                    <div className="mb-4 rounded-xl border border-tinta/10 bg-papel px-3 py-2 text-sm text-aco">
                      <span className="font-medium">Nota: </span>
                      {plano.notas_medicas}
                    </div>
                  )}

                  <div className="flex flex-col gap-3">
                    {plano.exercicios.length === 0 ? (
                      <p className="text-sm text-aco">Sem exercícios registados.</p>
                    ) : (
                      plano.exercicios.map((ex) => (
                        <div key={ex.id_exercicio} className="flex items-center gap-4 rounded-xl border border-tinta/10 bg-papel p-3 opacity-75">
                          <div className="relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-tinta/15">
                            {ex.url_video ? (
                              <video src={`${ex.url_video}#t=0.1`} className="h-full w-full object-cover" preload="metadata" muted playsInline />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-tinta/20">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col gap-1">
                            <p className="text-sm font-semibold text-tinta">{ex.nome_exercicio}</p>
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <span className="text-aco">⏱ {Math.floor(ex.duracao_segundos / 60)} min</span>
                              <span className="text-tinta/20">·</span>
                              <span className={`rounded-full px-2 py-0.5 font-semibold ${getDificuldadeColor(ex.dificuldade_clinica)}`}>
                                {getDificuldadeLabel(ex.dificuldade_clinica)}
                              </span>
                              <span className="text-tinta/20">·</span>
                              <span className="font-medium text-cobalto-vivo">+{ex.recompensa_xp} XP</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default PlanoList;