/**
 * Formas de resposta das rotas de LEITURA de planos.
 *
 * As chaves são deliberadamente iguais às que o frontend já lê hoje
 * (`service.fe/src/services/planosService.ts`): estas rotas substituem acessos
 * diretos ao Supabase e a troca só é segura se a forma não mudar.
 */

export interface ExercicioDoPlano {
  id_exercicio: string;
  nome_exercicio: string;
  duracao_segundos: number;
  dificuldade_clinica: string;
  recompensa_xp: number;
  url_video: string | null;
  repeticoes: number | null;
  materiais_necessarios: string | null;
  descricao: string | null;
}

/** Plano tal como a criança o vê (E1). */
export interface PlanoDoPaciente {
  id_plano: string;
  nome: string | null;
  frequencia_semanal: number;
  notas_medicas: string | null;
  data_inicio: string | null;
  data_validade: string | null;
  data_fim: string | null;
  ativo: boolean;
  dificuldade: string;
  condicao_paciente: string;
  /**
   * O plano foi montado pela própria criança (e não prescrito por um clínico).
   *
   * Sai calculado do servidor — autor igual a dono — para os ecrãs não terem de
   * adivinhar. Antes o critério era `notas_medicas === 'Plano criado pela
   * própria criança'`, repetido em quatro sítios e desfeito por qualquer edição
   * dessas notas.
   */
  criado_pelo_paciente: boolean;
  exercicios: ExercicioDoPlano[];
}

export interface PlanosDoPaciente {
  ativo: PlanoDoPaciente | null;
  historico: PlanoDoPaciente[];
}

/** Plano standard/template (E2): sem paciente associado. */
export interface PlanoStandard extends PlanoDoPaciente {
  condicao_clinica: string | null;
  is_standard: boolean;
}

/**
 * Plano público (E3), servido SEM sessão iniciada: só o mínimo que o ecrã
 * "Experimentar" usa. Nenhum texto clínico nem identificador de criança.
 */
export interface PlanoPublico {
  id_plano: string;
  exercicios: ExercicioDoPlano[];
}

/** Linha da lista de gestão do corpo clínico (E4). */
export interface PlanoGerido {
  id_plano: string;
  nome: string | null;
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

/** Plano a abrir no ecrã de edição (E5). */
export interface PlanoParaEdicao {
  id_prescricao: string;
  nome: string | null;
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
   * `null`. Não se aplica aqui o COALESCE com a duração do catálogo: o ecrã de
   * edição usa o `null` para saber que a duração não foi personalizada, e um
   * valor preenchido passaria a ser gravado como personalização ao guardar.
   */
  exercicios: { id_exercicio: string; duracao_segundos: number | null }[];
}
