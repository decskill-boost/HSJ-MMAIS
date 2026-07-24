import { supabase } from "./supabaseClient";
import { apiClient } from "./apiClient";
import { pacientesService } from "./pacientes";

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

export interface PlanoPorPaciente {
  id_paciente: string;
  nome: string;
  planos: PlanoAtivo[];
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

const isPlanoAtivo = (prescricao: { ativo?: boolean | null }): boolean =>
  prescricao.ativo === true;

interface PrescricaoDb {
  id_prescricao: string;
  frequencia_semanal: number;
  notas_medicas: string | null;
  data_inicio: string | null;
  data_validade: string | null;
  data_fim: string | null;
  ativo: boolean | null;
  id_paciente: string;
  dificuldade: string | null;
  condicao_paciente: string | null;
  condicao_clinica: string | null;
  is_standard: boolean | null;
}

const fetchPlanosPorPacientes = async (): Promise<PlanoPorPaciente[]> => {
  const pacientes = await pacientesService.getPacientes();
  const pacienteIds = pacientes.map((paciente) => paciente.id_user);
  if (pacienteIds.length === 0) return [];

  const { data: prescricoes, error } = await supabase
    .from("prescricoes")
    .select(
      "id_prescricao, frequencia_semanal, notas_medicas, data_inicio, data_validade, data_fim, ativo, id_paciente, dificuldade, condicao_paciente, condicao_clinica, is_standard",
    )
    .in("id_paciente", pacienteIds)
    .order("data_inicio", { ascending: false });

  if (error) throw new Error(error.message);

  const planosPorPaciente = new Map<string, PrescricaoDb[]>();
  (prescricoes as unknown as PrescricaoDb[] ?? []).forEach((prescricao) => {
    const pacienteId = prescricao.id_paciente;
    const lista = planosPorPaciente.get(pacienteId) ?? [];
    lista.push(prescricao);
    planosPorPaciente.set(pacienteId, lista);
  });

  return pacientes.map((paciente) => {
    const prescricoesDoPaciente = planosPorPaciente.get(paciente.id_user) ?? [];
    const planos = prescricoesDoPaciente
      .map((prescricao) => ({
        id_plano: prescricao.id_prescricao,
        frequencia_semanal: prescricao.frequencia_semanal,
        notas_medicas: prescricao.notas_medicas ?? null,
        data_inicio: prescricao.data_inicio ?? null,
        data_validade: prescricao.data_validade ?? null,
        data_fim: prescricao.data_fim ?? null,
        ativo: isPlanoAtivo(prescricao),
        dificuldade: prescricao.dificuldade ?? "facil",
        condicao_paciente: prescricao.condicao_paciente ?? "A",
        condicao_clinica: prescricao.condicao_clinica ?? null,
        is_standard: prescricao.is_standard ?? false,
        exercicios: [],
      }))
      .sort(
        (a, b) =>
          new Date(b.data_inicio ?? 0).getTime() -
          new Date(a.data_inicio ?? 0).getTime(),
      );

    return {
      id_paciente: paciente.id_user,
      nome: paciente.nome,
      planos,
    };
  });
};

export const planosService = {
  getTodosPlanosPorPaciente: async (
    idPaciente: string,
  ): Promise<{ ativo: PlanoAtivo | null; historico: PlanoAtivo[] }> => {
    const { data: prescricoes, error: errP } = await supabase
      .from("prescricoes")
      .select(
        "id_prescricao, frequencia_semanal, notas_medicas, data_inicio, data_validade, data_fim, ativo, dificuldade, condicao_paciente",
      )
      .eq("id_paciente", idPaciente);

    if (errP) throw new Error(errP.message);
    if (!prescricoes || prescricoes.length === 0)
      return { ativo: null, historico: [] };

    const ids = prescricoes.map((p) => p.id_prescricao);
    const { data: peData, error: errPE } = await supabase
      .from("prescricoes_exercicios")
      .select("id_prescricao, id_exercicio, duracao_segundos")
      .in("id_prescricao", ids);

    if (errPE) throw new Error(errPE.message);
    if (!peData || peData.length === 0) {
      const ativos = prescricoes.filter((p) => p.ativo);
      const inativos = prescricoes.filter((p) => !p.ativo);
      return {
        ativo: ativos[0]
          ? {
              id_plano: ativos[0].id_prescricao,
              frequencia_semanal: ativos[0].frequencia_semanal,
              notas_medicas: ativos[0].notas_medicas,
              dificuldade: ativos[0].dificuldade ?? "facil",
              condicao_paciente: ativos[0].condicao_paciente ?? "A",
              exercicios: [],
            }
          : null,
        historico: inativos.map((p) => ({
          id_plano: p.id_prescricao,
          frequencia_semanal: p.frequencia_semanal,
          notas_medicas: p.notas_medicas,
          dificuldade: p.dificuldade ?? "facil",
          condicao_paciente: p.condicao_paciente ?? "A",
          exercicios: [],
        })),
      };
    }

    const exercicioIds = [...new Set(peData.map((pe) => pe.id_exercicio))];
    const { data: exerciciosData, error: errE } = await supabase
      .from("exercicios")
      .select(
        "id_exercicio, nome_exercicio, duracao_segundos, dificuldade_clinica, recompensa_xp, url_video, repeticoes, materiais_necessarios",
      )
      .in("id_exercicio", exercicioIds);

    if (errE) throw new Error(errE.message);

    interface PrescricaoInfo {
      id_prescricao: string;
      frequencia_semanal: number;
      notas_medicas: string | null;
      data_inicio?: string | null;
      data_validade?: string | null;
      data_fim?: string | null;
      ativo?: boolean | null;
      dificuldade?: string | null;
      condicao_paciente?: string | null;
    }

    const mapPlano = (p: PrescricaoInfo): PlanoAtivo => ({
      id_plano: p.id_prescricao,
      frequencia_semanal: p.frequencia_semanal,
      notas_medicas: p.notas_medicas,
      data_inicio: p.data_inicio,
      data_validade: p.data_validade,
      data_fim: p.data_fim,
      ativo: isPlanoAtivo(p),
      dificuldade: p.dificuldade ?? "facil",
      condicao_paciente: p.condicao_paciente ?? "A",
      exercicios: peData
        .filter((pe) => pe.id_prescricao === p.id_prescricao)
        .map((pe) => {
          const e = (exerciciosData ?? []).find(
            (ex) => ex.id_exercicio === pe.id_exercicio,
          );
          if (!e) return null;
          return {
            ...e,
            duracao_segundos: pe.duracao_segundos ?? e.duracao_segundos,
          };
        })
        .filter(Boolean) as ExercicioDoPlano[],
    });

    const ativos = prescricoes.filter(isPlanoAtivo).map(mapPlano);
    const historico = prescricoes.filter((p) => !isPlanoAtivo(p)).map(mapPlano);

    return { ativo: ativos[0] ?? null, historico };
  },

  getPlanosStandard: async (): Promise<PlanoAtivo[]> => {
    const { data: prescricoes, error: errP } = await supabase
      .from("prescricoes")
      .select(
        "id_prescricao, frequencia_semanal, notas_medicas, data_inicio, data_validade, data_fim, ativo, dificuldade, condicao_paciente, condicao_clinica, is_standard",
      )
      .is("id_paciente", null)
      .eq("ativo", true);

    if (errP) throw new Error(errP.message);
    if (!prescricoes || prescricoes.length === 0) return [];

    const ids = prescricoes.map((p) => p.id_prescricao);
    const { data: peData, error: errPE } = await supabase
      .from("prescricoes_exercicios")
      .select("id_prescricao, id_exercicio, duracao_segundos")
      .in("id_prescricao", ids);

    if (errPE) throw new Error(errPE.message);
    if (!peData || peData.length === 0) {
      return prescricoes.map((p) => ({
        id_plano: p.id_prescricao,
        frequencia_semanal: p.frequencia_semanal,
        notas_medicas: p.notas_medicas,
        dificuldade: p.dificuldade ?? "facil",
        condicao_paciente: p.condicao_paciente ?? "A",
        condicao_clinica: p.condicao_clinica ?? null,
        is_standard: p.is_standard,
        exercicios: [],
      }));
    }

    const exercicioIds = [...new Set(peData.map((pe) => pe.id_exercicio))];
    const { data: exerciciosData, error: errE } = await supabase
      .from("exercicios")
      .select(
        "id_exercicio, nome_exercicio, duracao_segundos, dificuldade_clinica, recompensa_xp, url_video, repeticoes, materiais_necessarios",
      )
      .in("id_exercicio", exercicioIds);

    if (errE) throw new Error(errE.message);

    return prescricoes.map((p) => ({
      id_plano: p.id_prescricao,
      frequencia_semanal: p.frequencia_semanal,
      notas_medicas: p.notas_medicas,
      data_inicio: p.data_inicio,
      data_validade: p.data_validade,
      data_fim: p.data_fim,
      ativo: p.ativo === true,
      dificuldade: p.dificuldade ?? "facil",
      condicao_paciente: p.condicao_paciente ?? "A",
      condicao_clinica: p.condicao_clinica ?? null,
      is_standard: p.is_standard,
      exercicios: peData
        .filter((pe) => pe.id_prescricao === p.id_prescricao)
        .map((pe) => {
          const e = (exerciciosData ?? []).find(
            (ex) => ex.id_exercicio === pe.id_exercicio,
          );
          if (!e) return null;
          return {
            ...e,
            duracao_segundos: pe.duracao_segundos ?? e.duracao_segundos,
          };
        })
        .filter(Boolean) as ExercicioDoPlano[],
    }));
  },

  getPlanosPublicos: async (): Promise<PlanoAtivo[]> => {
    const IDS_PLANOS_PUBLICOS = [
      "050a0dc5-f3bf-48c2-ab0d-8558b10f0daf",
      "2f22e589-e54e-497f-9ac3-d85953a8ce73",
    ];

    const { data: prescricoes, error: errP } = await supabase
      .from("prescricoes")
      .select(
        "id_prescricao, frequencia_semanal, notas_medicas, data_inicio, data_validade, data_fim, ativo, dificuldade, condicao_paciente, condicao_clinica, is_standard",
      )
      .in("id_prescricao", IDS_PLANOS_PUBLICOS)
      .eq("ativo", true);

    if (errP) throw new Error(errP.message);
    if (!prescricoes || prescricoes.length === 0) return [];

    const ids = prescricoes.map((p) => p.id_prescricao);
    const { data: peData, error: errPE } = await supabase
      .from("prescricoes_exercicios")
      .select("id_prescricao, id_exercicio, duracao_segundos")
      .in("id_prescricao", ids);

    if (errPE) throw new Error(errPE.message);

    const exercicioIds = [...new Set((peData ?? []).map((pe) => pe.id_exercicio))];
    const { data: exerciciosData, error: errE } =
      exercicioIds.length > 0
        ? await supabase
            .from("exercicios")
            .select(
              "id_exercicio, nome_exercicio, duracao_segundos, dificuldade_clinica, recompensa_xp, url_video, repeticoes, materiais_necessarios",
            )
            .in("id_exercicio", exercicioIds)
        : { data: [], error: null };

    if (errE) throw new Error(errE.message);

    return prescricoes.map((p) => ({
      id_plano: p.id_prescricao,
      frequencia_semanal: p.frequencia_semanal,
      notas_medicas: p.notas_medicas,
      data_inicio: p.data_inicio,
      data_validade: p.data_validade,
      data_fim: p.data_fim,
      ativo: p.ativo === true,
      dificuldade: p.dificuldade ?? "facil",
      condicao_paciente: p.condicao_paciente ?? "A",
      condicao_clinica: p.condicao_clinica ?? null,
      is_standard: p.is_standard,
      exercicios: (peData ?? [])
        .filter((pe) => pe.id_prescricao === p.id_prescricao)
        .map((pe) => {
          const e = (exerciciosData ?? []).find(
            (ex) => ex.id_exercicio === pe.id_exercicio,
          );
          if (!e) return null;
          return {
            ...e,
            duracao_segundos: pe.duracao_segundos ?? e.duracao_segundos,
          };
        })
        .filter(Boolean) as ExercicioDoPlano[],
    }));
  },

  getPlanosPorPacientes: fetchPlanosPorPacientes,

  getPlanosPorPaciente: async (
    idPaciente: string,
  ): Promise<PlanoPorPaciente | null> => {
    const lista = await fetchPlanosPorPacientes();
    return (
      lista.find((paciente) => paciente.id_paciente === idPaciente) ?? null
    );
  },

  /**
   * Todos os planos criados (templates standard e prescritos), ativos ou
   * cancelados, para o corpo clínico gerir. Traz o nome do paciente quando o
   * plano é individual.
   */
  getTodosOsPlanos: async (): Promise<PlanoGerido[]> => {
    const { data: prescricoes, error: errP } = await supabase
      .from("prescricoes")
      .select(
        "id_prescricao, frequencia_semanal, notas_medicas, data_inicio, data_validade, ativo, dificuldade, condicao_paciente, is_standard, id_paciente",
      )
      .order("data_inicio", { ascending: false });

    if (errP) throw new Error(errP.message);
    if (!prescricoes || prescricoes.length === 0) return [];

    const ids = prescricoes.map((p) => p.id_prescricao);
    const { data: peData } = await supabase
      .from("prescricoes_exercicios")
      .select("id_prescricao, id_exercicio")
      .in("id_prescricao", ids);

    // Os nomes vêm pelo backend: o RLS de `utilizadores` não deixa o clínico
    // lê-los diretamente, e sem isto os planos prescritos apareciam sem nome.
    const nomes = new Map<string, string>();
    if (prescricoes.some((p) => p.id_paciente)) {
      try {
        const lista = await pacientesService.getPacientes();
        lista.forEach((p) => nomes.set(p.id_user, p.nome));
      } catch {
        // sem nomes, os cartões continuam a mostrar o resto da informação
      }
    }

    return prescricoes.map((p) => ({
      id_plano: p.id_prescricao,
      frequencia_semanal: p.frequencia_semanal,
      notas_medicas: p.notas_medicas ?? null,
      data_inicio: p.data_inicio ?? null,
      data_validade: p.data_validade ?? null,
      ativo: p.ativo === true,
      dificuldade: p.dificuldade ?? "facil",
      condicao_paciente: p.condicao_paciente ?? "A",
      is_standard: p.is_standard === true,
      id_paciente: p.id_paciente ?? null,
      nome_paciente: p.id_paciente ? (nomes.get(p.id_paciente) ?? null) : null,
      total_exercicios: (peData ?? []).filter(
        (pe) => pe.id_prescricao === p.id_prescricao,
      ).length,
    }));
  },

  /** Um plano com os seus exercícios, para pré-preencher o ecrã de edição. */
  getPlanoParaEdicao: async (idPrescricao: string) => {
    const { data: p, error } = await supabase
      .from("prescricoes")
      .select(
        "id_prescricao, frequencia_semanal, notas_medicas, data_validade, ativo, dificuldade, condicao_paciente, condicao_clinica, is_standard, id_paciente",
      )
      .eq("id_prescricao", idPrescricao)
      .single();
    if (error) throw new Error(error.message);

    const { data: pe } = await supabase
      .from("prescricoes_exercicios")
      .select("id_exercicio, duracao_segundos")
      .eq("id_prescricao", idPrescricao);

    return {
      ...p,
      exercicios: (pe ?? []).map((x) => ({
        id_exercicio: x.id_exercicio as string,
        duracao_segundos: x.duracao_segundos as number | null,
      })),
    };
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
    await apiClient.put(`/prescricoes/${idPrescricao}`, dados);
  },

  cancelPlano: async (idPrescricao: string): Promise<void> => {
    await apiClient.patch(`/prescricoes/${idPrescricao}/cancel`);
  },

  eliminarPlano: async (idPrescricao: string): Promise<void> => {
    const { error } = await supabase
      .from("prescricoes")
      .delete()
      .eq("id_prescricao", idPrescricao);
    if (error) throw new Error(error.message);
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
    await apiClient.post("/prescricoes", dados);
  },
};