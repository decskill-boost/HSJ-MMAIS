import { apiClient } from "./apiClient";
import { erroDaApi } from "./erroApi";

export interface Paciente {
  id_user: string;
  nome: string;
  email: string;
}

export interface PacienteDetalhe extends Paciente {
  nivel: number;
  xp: number;
  streak_atual: number;
}

/**
 * Uma linha de `GET /api/pacientes` com o identificador no nome de coluna
 * (`id_user`) que os ecrãs mais antigos já liam, e com os agregados que o
 * servidor calcula — `adesaoPercentual`, `ultimoTreino` e
 * `totalSessoesConcluidas`.
 *
 * Estende `Paciente` para continuar a servir quem só precisa do nome e do id.
 * Existe porque `getPacientes()` estava a deitar fora três campos que já vinham
 * na resposta: quem viesse a precisar deles recebia `undefined` sem que o
 * compilador se queixasse.
 */
export interface PacienteListado extends Paciente {
  adesaoPercentual: number | null;
  ultimoTreino: string | null;
  totalSessoesConcluidas: number;
}

/**
 * Uma linha de `GET /api/pacientes`, em camelCase.
 *
 * `ultimoTreino` e `totalSessoesConcluidas` são agregados no servidor. Antes o
 * browser descarregava as sessões do hospital inteiro, em páginas de mil, só
 * para descobrir a data mais recente e contar os treinos de cada criança.
 *
 * `ultimoTreino` é hora de parede (timestamp SEM fuso), no mesmo formato que o
 * PostgREST devolvia, e continua a ser lido como hora local.
 */
export interface PacienteComAdesao {
  idUser: string;
  nome: string;
  email: string;
  adesaoPercentual: number | null;
  ultimoTreino: string | null;
  totalSessoesConcluidas: number;
}

export type SessaoStatus = "iniciado" | "concluido" | "falhado";
export type DiaStatus = "concluido" | "falhado" | "ignorado" | "pendente" | "sem_plano";

export interface SessaoResumo {
  idSessao: string;
  nomeExercicio: string;
  status: SessaoStatus;
  esforco: number | null;
  diversao: number | null;
  duracaoSegundos: number | null;
  hora: string;
  teveProblemas?: boolean;
  participacaoFamiliares?: boolean;
  fcMaxima?: number | null;
  fcMedia?: number | null;
}

export interface DiaHistorico {
  data: string;
  status: DiaStatus;
  sessoes: SessaoResumo[];
}

export interface ResumoSemanal {
  semanaInicio: string;
  diasConcluidos: number;
  frequenciaEsperada: number;
}

export interface HistoricoResposta {
  dias: DiaHistorico[];
  resumoSemanal: ResumoSemanal[];
}

/**
 * Forma que `GET /api/pacientes/:id` devolve — em camelCase, ao contrário dos
 * nomes das colunas que o PostgREST expunha. É convertida para
 * `PacienteDetalhe` para o cabeçalho do perfil continuar a ler os mesmos
 * campos que lia antes.
 */
interface PacientePerfilResposta {
  idUser: string;
  nome: string;
  email: string;
  nivel: number;
  xp: number;
  streakAtual: number;
}

export const pacientesService = {
  // Busca todos os utilizadores que são pacientes.
  //
  // O token não é passado à mão em nenhuma destas chamadas: o interceptor do
  // `apiClient` junta-o a todos os pedidos. Passá-lo aqui outra vez era só
  // duplicar a leitura da sessão a cada chamada.
  //
  // Renomeia `idUser` para `id_user` — é o único ajuste de forma que faz aqui.
  // Os agregados seguem intactos: descartá-los não poupava nada (vinham na
  // mesma resposta) e só escondia dados de quem os pedisse a seguir.
  async getPacientes(): Promise<PacienteListado[]> {
    try {
      const response = await apiClient.get<PacienteComAdesao[]>("/pacientes");
      return (response.data ?? []).map((p) => ({
        id_user: p.idUser,
        nome: p.nome,
        email: p.email,
        adesaoPercentual: p.adesaoPercentual,
        ultimoTreino: p.ultimoTreino,
        totalSessoesConcluidas: p.totalSessoesConcluidas,
      }));
    } catch (erro) {
      throw erroDaApi(erro, "Não foi possível carregar os pacientes.");
    }
  },

  // Busca os dados básicos de um paciente para o cabeçalho do perfil — via
  // API, protegido por papel. A restrição a `tipo_utilizador = 'paciente'`
  // que a consulta direta tinha passou a ser imposta no servidor.
  async getPacienteById(id: string): Promise<PacienteDetalhe> {
    try {
      const response = await apiClient.get<PacientePerfilResposta>(
        `/pacientes/${id}`,
      );
      const perfil = response.data;

      return {
        id_user: perfil.idUser,
        nome: perfil.nome,
        email: perfil.email,
        nivel: perfil.nivel,
        xp: perfil.xp,
        streak_atual: perfil.streakAtual,
      };
    } catch (erro) {
      throw erroDaApi(erro, "Erro ao carregar paciente.");
    }
  },

  // Lista de pacientes com adesão, último treino e total de treinos — via API,
  // protegido por papel.
  async getPacientesComAdesao(): Promise<PacienteComAdesao[]> {
    try {
      const response = await apiClient.get<PacienteComAdesao[]>("/pacientes");
      return response.data ?? [];
    } catch (erro) {
      throw erroDaApi(erro, "Não foi possível carregar os pacientes.");
    }
  },

  // Histórico de assiduidade (concluído/falhado/ignorado) — via API, protegido por role
  async getHistorico(id: string, from?: string, to?: string): Promise<HistoricoResposta> {
    try {
      const response = await apiClient.get<HistoricoResposta>(
        `/pacientes/${id}/historico`,
        { params: { from, to } },
      );
      return response.data;
    } catch (erro) {
      throw erroDaApi(erro, "Não foi possível carregar o histórico.");
    }
  },
};