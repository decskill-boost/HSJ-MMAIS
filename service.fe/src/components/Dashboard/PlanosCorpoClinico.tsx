import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "../LoadingSpinner";
import BtnGlobal from "../BtnGlobal";
import EstadoVazio from "../ui/EstadoVazio";
import {
  CabecaTabela,
  CorpoTabela,
  LinhaMensagem,
  Tabela,
  Th,
} from "../ui/Tabela";
import { pacientesService } from "../../services/pacientes";

interface PacienteAcompanhado {
  id_user: string;
  nome: string;
  email: string;
  totalTreinos: number;
}

const PlanosCorpoClinico = () => {
  const navigate = useNavigate();
  const [pacientes, setPacientes] = useState<PacienteAcompanhado[]>([]);
  const [totalTreinosGerais, setTotalTreinosGerais] = useState(0);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [pesquisa, setPesquisa] = useState("");

  useEffect(() => {
    const carregarDados = async () => {
      try {
        setLoading(true);
        setErro(null);

        // Pacientes e treinos concluídos num só pedido: a contagem por criança
        // é agregada no servidor, em vez de se varrer aqui a tabela inteira de
        // sessões.
        const listaPacientes = await pacientesService.getPacientesComAdesao();

        const pacientesMapeados: PacienteAcompanhado[] = listaPacientes.map(
          (p) => ({
            id_user: p.idUser,
            nome: p.nome,
            email: p.email,
            totalTreinos: p.totalSessoesConcluidas ?? 0,
          }),
        );

        const totalTreinos = pacientesMapeados.reduce(
          (soma, p) => soma + p.totalTreinos,
          0,
        );

        setPacientes(pacientesMapeados);
        setTotalTreinosGerais(totalTreinos);
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
        setErro(
          err instanceof Error
            ? err.message
            : "Ocorreu um erro ao carregar os dados de acompanhamento.",
        );
      } finally {
        setLoading(false);
      }
    };

    void carregarDados();
  }, []);

  const termo = pesquisa.trim().toLowerCase();
  const pacientesFiltrados = termo
    ? pacientes.filter(
        (p) =>
          p.nome.toLowerCase().includes(termo) ||
          p.email.toLowerCase().includes(termo),
      )
    : pacientes;

  return (
    <div className="flex-1 bg-papel px-4 py-6 sm:px-6 lg:px-8">
      {/* Cabeçalho */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-wide text-tinta">
            Acompanhamento de Pacientes
          </h1>
          <p className="mt-1 text-sm text-aco">
            Veja a lista de pacientes inscritos e acompanhe as suas atividades físicas.
          </p>
        </div>
      </div>

      {/* Estatísticas Gerais */}
      <dl className="painel mb-4 flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <dt className="text-xs font-bold uppercase tracking-wider text-aco">
            Pacientes acompanhados
          </dt>
          <dd className="mt-1 font-display text-3xl tracking-wide text-cobalto">
            {loading ? "…" : pacientes.length}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase tracking-wider text-aco">
            Total de treinos
          </dt>
          <dd className="mt-1 font-display text-3xl tracking-wide text-cobalto">
            {loading ? "…" : totalTreinosGerais}
          </dd>
        </div>
      </dl>

      {erro && (
        <p
          role="alert"
          className="painel mb-6 border-capa p-4 text-sm font-bold text-capa-escura"
        >
          {erro}
        </p>
      )}

      {/* Pesquisa — com muitos pacientes, percorrer a lista à mão é impraticável */}
      <div className="mb-4">
        <label htmlFor="pesquisa-paciente" className="sr-only">
          Pesquisar paciente
        </label>
        <input
          id="pesquisa-paciente"
          type="search"
          value={pesquisa}
          onChange={(e) => setPesquisa(e.target.value)}
          placeholder="Pesquisar por nome ou email…"
          className="min-h-12 w-full max-w-md rounded-xl border-2 border-tinta/35 bg-papel-claro px-4 text-sm text-tinta placeholder:text-aco/70 focus:border-cobalto"
        />
      </div>

      {/* Listagem */}
      <Tabela legenda="Pacientes acompanhados e treinos concluídos">
        <CabecaTabela>
          <tr>
            <Th>Criança</Th>
            <Th>Email</Th>
            <Th className="text-center">Treinos concluídos</Th>
            <Th className="text-center">Ações</Th>
          </tr>
        </CabecaTabela>
        <CorpoTabela>
          {loading ? (
            <LinhaMensagem colunas={4}>
              <LoadingSpinner mensagem="A carregar pacientes..." />
            </LinhaMensagem>
          ) : pacientesFiltrados.length === 0 ? (
            <LinhaMensagem colunas={4}>
              <EstadoVazio
                titulo={
                  pesquisa ? "Sem resultados" : "Ainda não há pacientes"
                }
                descricao={
                  pesquisa
                    ? `Nenhum paciente corresponde a «${pesquisa}». Tente outro nome ou email.`
                    : "Assim que houver crianças inscritas, aparecem aqui com os treinos concluídos."
                }
              />
            </LinhaMensagem>
          ) : (
            pacientesFiltrados.map((p) => (
              <tr key={p.id_user} className="transition-colors hover:bg-raio/15">
                <td className="px-4 py-4 font-bold text-tinta">{p.nome}</td>
                <td className="px-4 py-4 text-aco">{p.email}</td>
                <td className="px-4 py-4 text-center">
                  <span className="inline-flex rounded-full border-2 border-cobalto bg-cobalto-nevoa px-3 py-1 text-xs font-bold text-cobalto">
                    {p.totalTreinos}{" "}
                    {p.totalTreinos === 1 ? "treino" : "treinos"}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap justify-center gap-2">
                    <BtnGlobal
                      onClick={() =>
                        navigate(`/plano/criar?paciente=${p.id_user}`)
                      }
                    >
                      Atribuir plano
                    </BtnGlobal>
                    <BtnGlobal
                      variant="secondary"
                      onClick={() =>
                        navigate(`/dashboard/medico/pacientes/${p.id_user}`)
                      }
                    >
                      Ver detalhe
                    </BtnGlobal>
                  </div>
                </td>
              </tr>
            ))
          )}
        </CorpoTabela>
      </Tabela>
    </div>
  );
};

export default PlanosCorpoClinico;
