import { apiClient } from "./apiClient";
import { erroDaApi } from "./erroApi";
import { exerciciosService } from "./exercicios";

export interface ExercicioDoPlano {
  id_exercicio: string;
  nome_exercicio: string;
  duracao_segundos: number;
  /**
   * NÚMERO nos ecrãs, TEXTO na base de dados.
   *
   * A coluna é `varchar` ('facil' | 'medio' | 'dificil') e é assim que as rotas
   * de planos a devolvem, mas os ecrãs comparam-na por limiares
   * (`<= 3` fácil, `<= 6` médio). É esta camada que faz a conversão — ver
   * `dificuldadeParaNumero`.
   */
  dificuldade_clinica: number;
  recompensa_xp: number;
  url_video: string;
  categoria?: string;
  materiais_necessarios?: string;
  condicao_paciente?: string;
  descricao?: string;
  repeticoes?: number;
}

/**
 * Escala da dificuldade clínica, a mesma que a Biblioteca de Exercícios já
 * usava. Vive aqui porque é aqui que entram os planos — ter duas cópias era o
 * caminho para elas divergirem.
 */
const ESCALA_DIFICULDADE: Record<string, number> = {
  facil: 1,
  medio: 5,
  dificil: 8,
};

/**
 * Converte a dificuldade clínica para o número que os ecrãs comparam.
 *
 * Sem isto, o texto que vem do servidor cai nas comparações `'facil' <= 3`, que
 * coagem para `NaN` e são sempre falsas: TODOS os exercícios de um plano
 * apareciam rotulados «Difícil», com a cor de alarme, incluindo os fáceis. O
 * TypeScript não apanhava nada porque o tipo declara `number`.
 *
 * Aceita já-números (a Biblioteca de Exercícios converte antes de chegar aqui)
 * e desconhecidos caem em 1 — 'facil', que é o `DEFAULT` da coluna.
 */
export const dificuldadeParaNumero = (valor: unknown): number => {
  if (typeof valor === "number" && Number.isFinite(valor)) return valor;

  const texto = String(valor ?? "").trim().toLowerCase();
  const daEscala = ESCALA_DIFICULDADE[texto];
  if (daEscala !== undefined) return daEscala;

  const numero = Number(texto);
  return texto !== "" && Number.isFinite(numero) ? numero : 1;
};

export interface PlanoAtivo {
  id_plano: string;
  frequencia_semanal: number;
  notas_medicas?: string | null;
  data_inicio?: string | null;
  data_validade?: string | null;
  data_fim?: string | null;
  ativo?: boolean;
  dificuldade?: string;
  condicao_paciente?: string;
  condicao_clinica?: string | null;
  is_standard?: boolean;
  exercicios: ExercicioDoPlano[];
}

/**
 * O que `GET /api/prescricoes/publicos` devolve na página "Experimentar", que
 * é servida SEM sessão iniciada: só o id do plano e os exercícios.
 *
 * É deliberadamente mais pobre do que `PlanoAtivo` — nem notas médicas, nem
 * datas, nem identificador de criança atravessam uma rota anónima. O ecrã só
 * lê estes dois campos, por isso nada muda no que se vê.
 */
export interface PlanoPublico {
  id_plano: string;
  exercicios: ExercicioDoPlano[];
}

/** Resumo de um plano para o corpo clínico gerir (listar/editar/cancelar). */
export interface PlanoGerido {
  id_plano: string;
  frequencia_semanal: number;
  notas_medicas: string | null;
  data_inicio: string | null;
  data_validade: string | null;
  ativo: boolean;
  dificuldade: string;
  condicao_paciente: string;
  is_standard: boolean;
  id_paciente: string | null;
  nome_paciente: string | null;
  total_exercicios: number;
}

/** Um plano tal como o ecrã de edição o pré-preenche. */
export interface PlanoParaEdicao {
  id_prescricao: string;
  frequencia_semanal: number;
  notas_medicas: string | null;
  data_validade: string | null;
  ativo: boolean;
  dificuldade: string;
  condicao_paciente: string;
  condicao_clinica: string | null;
  is_standard: boolean;
  id_paciente: string | null;
  /**
   * `duracao_segundos` é a duração ESPECÍFICA desta prescrição e pode ser
   * `null` — ao contrário das restantes rotas de leitura, aqui não é
   * substituída pela duração do catálogo: o ecrã usa o `null` para saber que a
   * duração não foi personalizada.
   */
  exercicios: { id_exercicio: string; duracao_segundos: number | null }[];
}

/** Um plano tal como as rotas de leitura o devolvem: com lista de exercícios. */
type ComExercicios = { exercicios: ExercicioDoPlano[] };

/**
 * Põe a resposta do servidor na forma que os ecrãs leem: dificuldade em número
 * e `exercicios` garantidamente um array (uma resposta truncada punha
 * `plano.exercicios.length` a rebentar em pleno render).
 */
const normalizarPlano = <T extends ComExercicios>(plano: T): T => ({
  ...plano,
  exercicios: (Array.isArray(plano.exercicios) ? plano.exercicios : []).map(
    (ex) => ({
      ...ex,
      dificuldade_clinica: dificuldadeParaNumero(ex.dificuldade_clinica),
    }),
  ),
});

/**
 * Catálogo de instruções, indexado por exercício.
 *
 * Enquanto estiver um pedido a caminho, quem chegar entretanto aproveita-o: o
 * ecrã dos planos pede os planos pessoais e os standard ao mesmo tempo, e não
 * vale a pena ir buscar o catálogo duas vezes. A referência é limpa no fim,
 * por isso não é cache — não guarda respostas velhas entre visitas ao ecrã.
 */
let catalogoEmVoo: Promise<Map<string, string>> | null = null;

const descricoesDoCatalogo = (): Promise<Map<string, string>> => {
  catalogoEmVoo ??= exerciciosService
    .getAll()
    .then((lista) => {
      const mapa = new Map<string, string>();
      (Array.isArray(lista) ? lista : []).forEach((ex) => {
        if (ex?.id_exercicio && ex.descricao) {
          mapa.set(ex.id_exercicio, ex.descricao);
        }
      });
      return mapa;
    })
    .finally(() => {
      catalogoEmVoo = null;
    });

  return catalogoEmVoo;
};

/**
 * Junta aos exercícios do plano as instruções escritas.
 *
 * As rotas de planos não trazem `descricao` — a consulta do servidor não a
 * seleciona — mas a coluna existe e `GET /exercicios` devolve-a. Sem ela, o
 * bloco «📋 Instruções» do leitor não é desenhado e a criança que faz um plano
 * PRESCRITO fica sem o texto do que tem de fazer: em modo plano o leitor abre
 * sem passar pela pré-visualização, e as instruções são a única alternativa
 * para quem não ouve o vídeo (os vídeos ainda não têm legendas).
 *
 * Se o catálogo falhar, os planos seguem à mesma sem instruções — que é
 * exatamente o que acontece hoje. Nunca faz falhar o carregamento do plano.
 */
const comInstrucoes = async <T extends ComExercicios>(
  planos: T[],
): Promise<T[]> => {
  const faltaAlguma = planos.some((p) =>
    p.exercicios.some((ex) => !ex.descricao),
  );
  if (!faltaAlguma) return planos;

  try {
    const descricoes = await descricoesDoCatalogo();
    return planos.map((plano) => ({
      ...plano,
      exercicios: plano.exercicios.map((ex) =>
        ex.descricao
          ? ex
          : { ...ex, descricao: descricoes.get(ex.id_exercicio) },
      ),
    }));
  } catch (erro) {
    console.error("Não foi possível ir buscar as instruções dos exercícios:", erro);
    return planos;
  }
};

export const planosService = {
  /**
   * Planos da PRÓPRIA criança.
   *
   * `GET /api/prescricoes/meus` tira o paciente do `sub` do token verificado —
   * não há caminho, query nem corpo por onde pedir os planos de outra criança.
   * O `idPaciente` fica na assinatura porque é quem está autenticado e serve de
   * guarda: sem utilizador não há nada a pedir.
   */
  getTodosPlanosPorPaciente: async (
    idPaciente: string,
  ): Promise<{ ativo: PlanoAtivo | null; historico: PlanoAtivo[] }> => {
    if (!idPaciente) return { ativo: null, historico: [] };

    try {
      const { data } = await apiClient.get<{
        ativo: PlanoAtivo | null;
        historico: PlanoAtivo[];
      }>("/prescricoes/meus");

      const ativo = data?.ativo ? normalizarPlano(data.ativo) : null;
      const historico = (
        Array.isArray(data?.historico) ? data.historico : []
      ).map(normalizarPlano);

      // O ativo vai no mesmo lote que o histórico para o catálogo de
      // instruções ser pedido uma só vez.
      const planos = await comInstrucoes(ativo ? [ativo, ...historico] : historico);

      return {
        ativo: ativo ? (planos[0] ?? null) : null,
        historico: ativo ? planos.slice(1) : planos,
      };
    } catch (erro) {
      throw erroDaApi(erro, "Não foi possível carregar os teus planos.");
    }
  },

  getPlanosStandard: async (): Promise<PlanoAtivo[]> => {
    try {
      const { data } = await apiClient.get<PlanoAtivo[]>(
        "/prescricoes/standard",
      );
      return comInstrucoes(
        (Array.isArray(data) ? data : []).map(normalizarPlano),
      );
    } catch (erro) {
      throw erroDaApi(erro, "Não foi possível carregar os planos standard.");
    }
  },

  /**
   * Planos de demonstração da página "Experimentar".
   *
   * A lista de ids deixou de estar aqui: era uma constante no pacote do
   * frontend, onde qualquer pessoa a podia trocar por um id de uma prescrição
   * real. Passou a ser uma constante do servidor, que exige ainda
   * `id_paciente IS NULL`.
   *
   * Aqui não se juntam as instruções escritas como nas rotas com sessão: esta
   * página é anónima e `GET /exercicios` exige sessão. A pré-visualização
   * esconde o bloco quando não há descrição, por isso o ecrã não parte — o
   * treino de demonstração é que fica sem texto de apoio.
   */
  getPlanosPublicos: async (): Promise<PlanoPublico[]> => {
    try {
      const { data } = await apiClient.get<PlanoPublico[]>(
        "/prescricoes/publicos",
      );
      return (Array.isArray(data) ? data : []).map(normalizarPlano);
    } catch (erro) {
      throw erroDaApi(erro, "Não foi possível carregar os planos.");
    }
  },

  /**
   * Todos os planos criados (templates standard e prescritos), ativos ou
   * cancelados, para o corpo clínico gerir. O nome do paciente e a contagem de
   * exercícios vêm já agregados do servidor — antes eram três consultas e a
   * lista inteira de pacientes pedida só para extrair um nome.
   */
  getTodosOsPlanos: async (): Promise<PlanoGerido[]> => {
    try {
      const { data } = await apiClient.get<PlanoGerido[]>("/prescricoes");
      return data ?? [];
    } catch (erro) {
      throw erroDaApi(erro, "Não foi possível carregar os planos.");
    }
  },

  /** Um plano com os seus exercícios, para pré-preencher o ecrã de edição. */
  getPlanoParaEdicao: async (
    idPrescricao: string,
  ): Promise<PlanoParaEdicao> => {
    try {
      const { data } = await apiClient.get<PlanoParaEdicao>(
        `/prescricoes/${idPrescricao}`,
      );
      // Ou vem completo, ou rebenta: abrir o editor com a lista de exercícios
      // vazia por causa de uma resposta truncada fazia com que guardar apagasse
      // os exercícios que a criança tinha prescritos.
      return { ...data, exercicios: data?.exercicios ?? [] };
    } catch (erro) {
      throw erroDaApi(erro, "Não foi possível carregar o plano.");
    }
  },

  /**
   * Atualiza um plano existente.
   * Vai pelo backend (e não direto ao Supabase) porque a tabela `prescricoes`
   * tem RLS com políticas de INSERT/DELETE/SELECT mas **sem UPDATE** — a
   * alteração feita do frontend era silenciosamente filtrada, sem erro.
   */
  atualizarPlano: async (
    idPrescricao: string,
    dados: {
      frequencia_semanal: number;
      data_validade: string | null;
      notas_medicas: string;
      dificuldade?: string;
      condicao_paciente?: string;
      condicao_clinica?: string | null;
      exercicios: { id_exercicio: string; duracao_segundos?: number }[];
    },
  ): Promise<void> => {
    try {
      await apiClient.put(`/prescricoes/${idPrescricao}`, dados);
    } catch (erro) {
      throw erroDaApi(erro, "Não foi possível guardar as alterações.");
    }
  },

  cancelPlano: async (idPrescricao: string): Promise<void> => {
    try {
      await apiClient.patch(`/prescricoes/${idPrescricao}/cancel`);
    } catch (erro) {
      throw erroDaApi(erro, "Não foi possível cancelar.");
    }
  },

  /**
   * Elimina um plano.
   *
   * O servidor devolve 409 com a explicação quando o plano já tem treinos
   * associados; `erroDaApi` traz essa mensagem para a `message` do `Error`,
   * que é o que a GestaoPlanos mostra.
   */
  eliminarPlano: async (idPrescricao: string): Promise<void> => {
    try {
      await apiClient.delete(`/prescricoes/${idPrescricao}`);
    } catch (erro) {
      throw erroDaApi(
        erro,
        "Não foi possível eliminar. O plano pode já ter treinos associados.",
      );
    }
  },

  criarPlano: async (dados: {
    id_paciente: string | null;
    id_medico: string;
    frequencia_semanal: number;
    data_validade: string | null;
    notas_medicas: string;
    is_standard?: boolean;
    dificuldade?: string;
    condicao_paciente?: string;
    condicao_clinica?: string | null;
    exercicios: (string | { id_exercicio: string; duracao_segundos?: number })[];
  }): Promise<void> => {
    try {
      await apiClient.post("/prescricoes", dados);
    } catch (erro) {
      throw erroDaApi(erro, "Não foi possível criar o plano.");
    }
  },
};
