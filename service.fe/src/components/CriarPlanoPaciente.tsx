import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { exerciciosService, type Exercicio } from "../services/exercicios";
import { planosService } from "../services/planosService";
import { useUser } from "../contexts/UserContext";
import LoadingSpinner from "./LoadingSpinner";
import MiniaturaVideo from "./ui/MiniaturaVideo";
import Modal from "./ui/Modal";

// Mostrar duração como a biblioteca (minutos)
const formatarDuracao = (s: number) =>
  s < 60 ? `${s} seg` : `${Math.round(s / 60)} min`;

export const CriarPlanoPaciente = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [exercicios, setExercicios] = useState<Exercicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [nomePlano, setNomePlano] = useState("");
  const [aGuardar, setAGuardar] = useState(false);
  const [planoCriadoId, setPlanoCriadoId] = useState<string | null>(null);

  // Buscar os exercícios reais à API
  useEffect(() => {
    const buscar = async () => {
      try {
        setLoading(true);
        setErro(null);
        const data = await exerciciosService.getAll();
        setExercicios(Array.isArray(data) ? data.filter((e) => e.ativo) : []);
      } catch {
        setErro("Não conseguimos carregar os exercícios. Tenta novamente mais tarde!");
      } finally {
        setLoading(false);
      }
    };
    buscar();
  }, []);

  const toggleExercicio = (id: string) => {
    setSelecionados((atual) =>
      atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id],
    );
  };

  const guardarPlano = async () => {
    if (!user || selecionados.length === 0) return;
    setAGuardar(true);
    setErro(null);
    try {
      const response = await planosService.criarPlano({
        id_paciente: user.idUser,
        id_medico: user.idUser,
        frequencia_semanal: 3,
        data_validade: null,
        // Sem notas médicas: este campo é do corpo clínico e aparecia no cartão
        // do plano como se fosse indicação médica. Que o plano é dela fica
        // registado na própria prescrição (o autor é o dono) e chega ao ecrã
        // como `criado_pelo_paciente`.
        notas_medicas: "",
        is_standard: false,
        nome: nomePlano.trim() || "O meu Plano",
        exercicios: selecionados,
      });
      setPlanoCriadoId(response.id_prescricao);
    } catch (e) {
      setErro(
        e instanceof Error ? e.message : "Não foi possível guardar o teu plano.",
      );
      setAGuardar(false);
    }
  };

  const handleComecarAgora = () => {
    navigate("/paciente/planos", { state: { startPlanoId: planoCriadoId, view: "plano-list" } });
  };

  const handleDepois = () => {
    navigate("/paciente/planos", { state: { view: "plano-list" } });
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Cabeçalho */}
      <div className="mb-8 rounded-(--radius-vinheta) border-[3px] border-tinta bg-raio/10 p-6 text-center shadow-vinheta sm:p-10">
        <span className="mb-4 inline-block text-6xl">✍️</span>
        <h1 className="font-display text-4xl uppercase tracking-wider text-tinta sm:text-5xl">
          Cria o teu plano!
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-aco">
          Dá um nome ao teu plano e escolhe os exercícios que queres fazer.
        </p>

        <div className="mx-auto mt-6 max-w-md">
          <input
            type="text"
            value={nomePlano}
            onChange={(e) => setNomePlano(e.target.value)}
            placeholder="Ex: O meu Mega Treino!"
            className="w-full rounded-2xl border-[3px] border-tinta bg-papel px-4 py-3 text-center font-display text-xl text-tinta placeholder:text-aco/50 focus:border-raio focus:outline-none focus:ring-4 focus:ring-raio/20"
            maxLength={50}
          />
        </div>
      </div>

      {erro && (
        <div className="mb-6 rounded-2xl border-[3px] border-capa bg-capa/10 p-4 text-center font-bold text-capa-escura shadow-sm">
          {erro}
        </div>
      )}

      {loading ? (
        <LoadingSpinner mensagem="A procurar os melhores exercícios..." />
      ) : (
        <>
          {/* Lista de Exercícios (estilo grelha) */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {exercicios.map((ex) => {
              const selecionado = selecionados.includes(ex.id_exercicio);
              return (
                <div
                  key={ex.id_exercicio}
                  onClick={() => toggleExercicio(ex.id_exercicio)}
                  className={`group relative flex cursor-pointer flex-col overflow-hidden rounded-(--radius-vinheta) border-[3px] transition-all duration-300 hover:-translate-y-1 ${
                    selecionado
                      ? "border-cobalto bg-cobalto/5 shadow-[4px_4px_0px_#2741d4]"
                      : "border-tinta bg-papel-claro shadow-vinheta hover:shadow-[4px_4px_0px_#18181b]"
                  }`}
                >
                  <div className="relative aspect-video w-full border-b-[3px] border-tinta bg-preto">
                    <MiniaturaVideo url={ex.url_video ?? ""} />
                    {selecionado && (
                      <div className="absolute inset-0 flex items-center justify-center bg-cobalto/40 backdrop-blur-sm transition-all">
                        <div className="rounded-full bg-papel p-2 text-cobalto shadow-lg">
                          <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="font-display text-lg tracking-wide text-tinta">
                      {ex.nome_exercicio}
                    </h3>
                    <div className="mt-auto pt-3 flex items-center justify-between">
                      <span className="rounded-full border-[2px] border-tinta/10 bg-papel px-3 py-1 text-xs font-bold text-aco">
                        ⏱️ {formatarDuracao(ex.duracao_segundos)}
                      </span>
                      <span className="rounded-full border-[2px] border-turbo/20 bg-turbo/10 px-3 py-1 text-xs font-bold text-turbo-escuro">
                        ⭐ {ex.recompensa_xp} XP
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Botão Flutuante (apenas aparece se houver selecionados) */}
          {selecionados.length > 0 && (
            <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-center p-6 bg-gradient-to-t from-papel via-papel/80 to-transparent">
              <button
                onClick={guardarPlano}
                disabled={aGuardar}
                className="flex items-center gap-3 rounded-full border-[3px] border-tinta bg-turbo px-8 py-4 font-display text-2xl tracking-wide text-tinta shadow-vinheta transition hover:bg-turbo-claro hover:-translate-y-1 active:scale-95 disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {aGuardar ? "A gravar..." : "💪 Guardar o meu plano"}
                <span className="rounded-full bg-papel/50 px-3 py-1 text-lg">
                  {selecionados.length}
                </span>
              </button>
            </div>
          )}

          {planoCriadoId && (
            <Modal titulo="Plano Criado com Sucesso" aoFechar={handleDepois}>
              <div className="p-6 text-center">
                <span className="mb-4 inline-block text-6xl">🎉</span>
                <h2 className="mb-4 font-display text-3xl tracking-wide text-tinta">
                  Plano Criado com Sucesso!
                </h2>
                <p className="mb-8 text-lg text-aco">
                  O teu novo plano "{nomePlano.trim() || "Plano personalizado"}" está guardado e pronto. Queres começar a treinar agora?
                </p>
                <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                  <button
                    onClick={handleDepois}
                    className="rounded-full border-[3px] border-tinta bg-papel-claro px-8 py-3 font-display text-xl text-tinta shadow-vinheta transition hover:bg-papel hover:-translate-y-0.5 active:scale-95"
                  >
                    Agora Não
                  </button>
                  <button
                    onClick={handleComecarAgora}
                    className="rounded-full border-[3px] border-tinta bg-cobalto px-8 py-3 font-display text-xl text-papel shadow-vinheta transition hover:bg-cobalto-escuro hover:-translate-y-0.5 active:scale-95"
                  >
                    ▶️ Começar Plano
                  </button>
                </div>
              </div>
            </Modal>
          )}
        </>
      )}
    </div>
  );
};

export default CriarPlanoPaciente;
