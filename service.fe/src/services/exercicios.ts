import { apiClient } from "./apiClient";

export interface Exercicio {
  id_exercicio: string;
  nome_exercicio: string;
  recompensa_xp: number;
  categoria: string;
  url_video?: string;
  duracao_segundos: number;
  dificuldade_clinica: string;
  descricao?: string;
  materiais_necessarios?: string;
  condicao_paciente?: string;
  ativo: boolean;
}

export const exerciciosService = {
  // Buscar todos os exercícios
  async getAll(): Promise<Exercicio[]> {
    const response = await apiClient.get("/exercicios");
    return response.data;
  },

  //Adicionar um novo exercício
  async create(
    dados: Omit<Exercicio, "id_exercicio" | "ativo">,
  ): Promise<Exercicio> {
    const response = await apiClient.post("/exercicios", dados);
    return response.data;
  },

  // Atualizar um exercício
  async update(id: string, dados: Partial<Exercicio>): Promise<Exercicio> {
    const response = await apiClient.put(`/exercicios/${id}`, dados);
    return response.data;
  },

  // Eliminar um exercício (soft delete)
  async remove(id: string): Promise<void> {
    await apiClient.delete(`/exercicios/${id}`);
  },
};
