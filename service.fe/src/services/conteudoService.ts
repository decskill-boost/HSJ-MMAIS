import { apiClient } from './apiClient';

export interface LandingContent {
  hero_titulo?: string;
  hero_subtitulo?: string;
  hero_frase?: string;
  hero_uls?: string;
  logo_1_url?: string;
  logo_2_url?: string;
}

export const conteudoService = {
  getLandingContent: async (): Promise<LandingContent> => {
    const response = await apiClient.get<LandingContent>('/conteudo/landing');
    return response.data;
  },

  updateLandingContent: async (data: LandingContent): Promise<void> => {
    await apiClient.put('/conteudo/landing', data);
  },
};
