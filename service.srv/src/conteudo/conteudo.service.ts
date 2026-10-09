import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConteudoSite } from '../entities/conteudo-site.entity';

@Injectable()
export class ConteudoService {
  constructor(
    @InjectRepository(ConteudoSite)
    private conteudoRepo: Repository<ConteudoSite>,
  ) {}

  async getLandingContent(): Promise<Record<string, string>> {
    const contents = await this.conteudoRepo.find();
    const result: Record<string, string> = {};
    for (const item of contents) {
      result[item.chave] = item.valor;
    }
    return result;
  }

  async updateLandingContent(data: Record<string, string>): Promise<void> {
    for (const [chave, valor] of Object.entries(data)) {
      await this.conteudoRepo.save({ chave, valor });
    }
  }
}
