import { apiClient } from "./apiClient";
import { erroDaApi } from "./erroApi";

export interface ExercicioDoPlano {
  id_exercicio: string;
  nome_exercicio: string;
  duracao_segundos: number;
  dificuldade_clinica: number;
  recompensa_xp: number;
  url_video: string;
  categoria?: string;
  materiais_necessarios?: string;
  condicao_paciente?: string;
  descricao?: string;
  repeticoes?: number;
}

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

      return {
        ativo: data?.ativo ?? null,
        historico: data?.historico ?? [],
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
      return data ?? [];
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
   */
  getPlanosPublicos: async (): Promise<PlanoPublico[]> => {
    try {
      const { data } = await apiClient.get<PlanoPublico[]>(
        "/prescricoes/publicos",
      );
      return data ?? [];
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
