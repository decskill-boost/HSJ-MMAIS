import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import BtnGlobal from "../BtnGlobal";
import EstadoVazio from "../ui/EstadoVazio";
import {
  CabecaTabela,
  CorpoTabela,
  LinhaMensagem,
  Tabela,
  Th,
} from "../ui/Tabela";
import type { UserProfile } from "../../types/user";
import LoadingSpinner from "../LoadingSpinner";
import { mensagemDeErro } from "../../services/erroApi";
import { pacientesService } from "../../services/pacientes";
import { sessoesService } from "../../services/sessoesService";

interface LayoutContext {
  user: UserProfile | null;
  handleLogin: (userProfile: UserProfile) => boolean;
  handleLogout: () => void;
}

interface PacienteComUltimoTreino {
  id_user: string;
  nome: string;
  email: string;
  ultimoTreino: string;
  ultimoTreinoDate: Date | null;
}

const DashboardCorpoClinico = () => {
  const navigate = useNavigate();
  const { user } = useOutletContext<LayoutContext>();
  // Nome tal como está registado. Não prefixar "Dr." — o nome já costuma trazer
  // o título (Dr./Dra./Enf.) e antes saía "Olá, Dr. Dra.".
  const displayName = user?.nome?.trim() || "Colega";

  const [pacientes, setPacientes] = useState<PacienteComUltimoTreino[]>([]);
  const [totalTreinos, setTotalTreinos] = useState(0);
  const [treinosSemana, setTreinosSemana] = useState(0);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const paginatedPacientes = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return pacientes.slice(startIndex, startIndex + itemsPerPage);
  }, [pacientes, currentPage]);

  const totalPaginas = Math.ceil(pacientes.length / itemsPerPage);

  // Quem não treina há mais de 7 dias (ou nunca treinou) — o que o clínico
  // precisa de ver primeiro. Limitado a 5 para o painel não crescer sem fim.
  const precisamAtencao = useMemo(() => {
    const limite = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return pacientes
      .filter(
        (p) => !p.ultimoTreinoDate || p.ultimoTreinoDate.getTime() < limite,
      )
      .slice(0, 5);
  }, [pacientes]);

  useEffect(() => {
    const carregar = async () => {
      try {
        setLoading(true);
        setErro(null);
        
        // Tudo agregado no servidor, num par de pedidos:
        //  - `GET /api/pacientes` traz o último treino de cada criança. Antes
        //    o browser descarregava as sessões do hospital inteiro, em páginas
        //    de mil, só para descobrir a data mais recente de cada uma.
        //  - `sessoesService.getEstatisticas()` traz os dois contadores. Antes
        //    eram dois `count` diretos à tabela e a fronteira dos 7 dias era
        //    calculada com o relógio do posto de trabalho.
        const [listaPacientes, estatisticas] = await Promise.all([
          pacientesService.getPacientesComAdesao(),
          sessoesService.getEstatisticas(),
        ]);

        const formatarDataExibicao = (data: Date) => {
          return data.toLocaleString("pt-PT", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
        };

        const mapeados = listaPacientes.map((p) => {
          // Timestamp sem fuso: lido como hora local, tal como antes.
          const bruto = p.ultimoTreino ? new Date(p.ultimoTreino) : null;
          const ultimoDate =
            bruto && !Number.isNaN(bruto.getTime()) ? bruto : null;
          return {
            id_user: p.idUser,
            nome: p.nome,
            email: p.email,
            ultimoTreino: ultimoDate ? formatarDataExibicao(ultimoDate) : "Nunca treinou",
            ultimoTreinoDate: ultimoDate,
          };
        });

        setPacientes(mapeados);
        setTotalTreinos(estatisticas.totalConcluidas);
        setTreinosSemana(estatisticas.concluidasUltimos7Dias);
      } catch (e) {
        setErro(mensagemDeErro(e, "Não foi possível carregar os dados."));
      } finally {
        setLoading(false);
      }
    };

    void carregar();
  }, []);

  return (
    <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        {/* Cabeçalho — QG clínico é sóbrio (Papel/Cobalto/Aço). O banner escuro
            anterior era linguagem da Academia e tornava o botão ilegível. */}
        <section className="rounded-(--radius-vinheta) border-[3px] border-tinta bg-papel-claro p-6 shadow-vinheta sm:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-cobalto">
                Painel do Corpo Clínico
              </p>
              <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-tinta sm:text-4xl">
                Olá, {displayName}
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-aco">
                Acompanhe o progresso das crianças, reveja protocolos e
                monitorize atividades físicas.
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <div className="rounded-xl border border-tinta/15 bg-papel px-4 py-3 text-center">
                <p className="text-xs font-bold uppercase tracking-wide text-aco">
                  Pacientes
                </p>
                <p className="mt-0.5 text-2xl font-bold text-tinta">
                  {loading ? "…" : pacientes.length}
                </p>
              </div>
              <button
                onClick={() => navigate("/perfil")}
                className="rounded-(--radius-vinheta) border-[3px] border-tinta bg-papel-claro px-4 py-2.5 text-sm font-bold text-tinta shadow-vinheta transition hover:bg-papel active:scale-95 active:shadow-none"
              >
                Informação pessoal
              </button>
            </div>
          </div>
        </section>

        {/* Métricas */}
        <section className="grid gap-4 lg:grid-cols-3">
          <article className="rounded-(--radius-vinheta) border-[3px] border-tinta bg-papel-claro p-5 shadow-vinheta">
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-tinta">
              Pacientes Acompanhados
            </p>
            <p className="mt-4 text-3xl font-bold text-tinta">
              {loading ? "…" : pacientes.length}
            </p>
            <p className="mt-2 text-sm text-tinta/80">
              Crianças e jovens em acompanhamento.
            </p>
          </article>

          <article className="rounded-(--radius-vinheta) border-[3px] border-tinta bg-papel-claro p-5 shadow-vinheta">
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-tinta">
              Total de Treinos
            </p>
            <p className="mt-4 text-3xl font-bold text-tinta">
              {loading ? "…" : totalTreinos}
            </p>
            <p className="mt-2 text-sm text-tinta/80">
              Sessões concluídas com sucesso.
            </p>
          </article>

          <article className="rounded-(--radius-vinheta) border-[3px] border-tinta bg-papel-claro p-5 shadow-vinheta">
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-tinta">
              Treinos esta Semana
            </p>
            <p className="mt-4 text-3xl font-bold text-tinta">
              {loading ? "…" : treinosSemana}
            </p>
            <p className="mt-2 text-sm text-tinta/80">
              Sessões concluídas nos últimos 7 dias.
            </p>
          </article>
        </section>

        {/* Tabela de pacientes e ações rápidas */}
        <section className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
          <article className="rounded-(--radius-vinheta) border-[3px] border-tinta bg-papel-claro p-6 shadow-vinheta">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-tinta">Pacientes</h2>
                <p className="mt-1 text-sm text-aco">
                  Clique numa linha para ver o detalhe do paciente.
                </p>
              </div>
              <BtnGlobal
                onClick={() => navigate("/dashboard/medico/pacientes")}
                className="px-4 py-2.5 text-sm font-semibold"
              >
                Ver Pacientes
              </BtnGlobal>
            </div>

            {erro && (
              <div className="mt-4 rounded-2xl bg-capa/10 p-4 text-sm text-capa-escura">
                {erro}
              </div>
            )}

            <Tabela
              legenda="Pacientes e data do último treino"
              className="mt-6"
            >
              <CabecaTabela>
                <tr>
                  <Th>Criança</Th>
                  <Th className="text-center">Último treino</Th>
                </tr>
              </CabecaTabela>
              <CorpoTabela>
                {loading ? (
                  <LinhaMensagem colunas={2}>
                    <LoadingSpinner mensagem="A carregar pacientes..." />
                  </LinhaMensagem>
                ) : pacientes.length === 0 ? (
                  <LinhaMensagem colunas={2}>
                    <EstadoVazio
                      titulo="Ainda não há pacientes"
                      descricao="Assim que houver crianças a treinar, o último treino de cada uma aparece aqui."
                    />
                  </LinhaMensagem>
                ) : (
                  paginatedPacientes.map((paciente) => (
                    <tr
                      key={paciente.id_user}
                      onClick={() =>
                        navigate(
                          `/dashboard/medico/pacientes/${paciente.id_user}`,
                        )
                      }
                      className="cursor-pointer transition-colors hover:bg-raio/15"
                    >
                      <td className="px-4 py-4 font-bold text-tinta">
                        {/* Ligação a sério: a linha só era clicável com rato. */}
                        <Link
                          to={`/dashboard/medico/pacientes/${paciente.id_user}`}
                          className="hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {paciente.nome}
                        </Link>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span
                          className={`inline-flex rounded-full border-2 px-3 py-1 text-xs font-bold ${
                            paciente.ultimoTreinoDate
                              ? "border-turbo bg-turbo/20 text-turbo-escuro"
                              : "border-tinta/20 bg-papel text-aco"
                          }`}
                        >
                          {paciente.ultimoTreino}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </CorpoTabela>
            </Tabela>

            {totalPaginas > 1 && (
              <nav
                aria-label="Paginação da lista de pacientes"
                className="mt-4 flex items-center justify-between gap-4 border-t-2 border-tinta/10 pt-4"
              >
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => prev - 1)}
                  className="min-h-11 rounded-(--radius-vinheta) border-2 border-tinta bg-papel-claro px-4 text-xs font-bold text-tinta transition-colors hover:bg-raio/25 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Anterior
                </button>
                <span aria-live="polite" className="text-xs font-bold text-aco">
                  Página {currentPage} de {totalPaginas}
                </span>
                <button
                  disabled={currentPage === totalPaginas}
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                  className="min-h-11 rounded-(--radius-vinheta) border-2 border-tinta bg-papel-claro px-4 text-xs font-bold text-tinta transition-colors hover:bg-raio/25 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Seguinte
                </button>
              </nav>
            )}
          </article>

          {/* Antes eram "Ações rápidas" que repetiam a sidebar inteira.
              Passa a mostrar quem precisa mesmo de atenção, com ação direta. */}
          <article className="rounded-(--radius-vinheta) border-[3px] border-tinta bg-papel-claro p-6 shadow-vinheta">
            <div>
              <h2 className="text-lg font-bold text-tinta">
                Precisam de atenção
              </h2>
              <p className="mt-1 text-sm text-aco">
                Sem treinos nos últimos 7 dias.
              </p>
            </div>

            <div className="mt-5 space-y-3">
              {loading ? (
                <p className="text-sm text-aco">A carregar…</p>
              ) : precisamAtencao.length === 0 ? (
                <p className="rounded-2xl border border-turbo/30 bg-turbo/10 p-4 text-sm font-medium text-turbo-escuro">
                  Todos os pacientes treinaram esta semana. 👏
                </p>
              ) : (
                precisamAtencao.map((p) => (
                  <div
                    key={p.id_user}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-tinta/15 bg-papel p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-tinta">
                        {p.nome}
                      </p>
                      <p className="truncate text-xs text-aco">
                        {p.ultimoTreino}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        navigate(`/plano/criar?paciente=${p.id_user}`)
                      }
                      className="shrink-0 rounded-xl border-2 border-tinta bg-cobalto px-3 py-1.5 text-xs font-bold text-papel transition hover:bg-cobalto-vivo active:scale-95"
                    >
                      Atribuir plano
                    </button>
                  </div>
                ))
              )}
            </div>
          </article>
        </section>
      </div>
    </div>
  );
};

export default DashboardCorpoClinico;
