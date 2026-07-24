import { BadRequestException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindOptionsWhere, In, MoreThanOrEqual, Repository } from 'typeorm';
import { Prescricao } from '../entities/prescricao.entity';
import { SessaoRealizada } from '../entities/sessao-realizada.entity';
import { Utilizador } from '../entities/utilizador.entity';
import { toLisbonDateKey } from '../sessoes/streak.util';
import { UserRole } from '../users/user-role.enum';
import {
  calcularAdesao,
  deriveHistorico,
  HistoricoResultado,
  PrescricaoWindow,
  SessaoParaHistorico,
} from './historico.util';

export interface PacienteComAdesao {
  idUser: string;
  nome: string;
  email: string;
  adesaoPercentual: number | null;
}

const MAX_DIAS_INTERVALO = 92;

@Injectable()
export class PacientesService {
  constructor(
    @InjectRepository(Utilizador)
    private readonly utilizadorRepo: Repository<Utilizador>,
    @InjectRepository(Prescricao)
    private readonly prescricaoRepo: Repository<Prescricao>,
    @InjectRepository(SessaoRealizada)
    private readonly sessaoRepo: Repository<SessaoRealizada>,
  ) {}

  private defaultRange(): { from: string; to: string } {
    const hoje = new Date();
    const primeiroDiaDoMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    return { from: toLisbonDateKey(primeiroDiaDoMes), to: toLisbonDateKey(hoje) };
  }

  async getHistorico(
    idPaciente: string,
    from?: string,
    to?: string,
    medicoId?: string,
  ): Promise<HistoricoResultado> {
    const paciente = await this.utilizadorRepo.findOne({
      where: { id_user: idPaciente },
    });
    if (!paciente || paciente.tipo_utilizador !== UserRole.PACIENTE) {
      throw new NotFoundException('Paciente não encontrado');
    }

    if (medicoId) {
      const doctor = await this.utilizadorRepo.findOne({ where: { id_user: medicoId } });
      if (!doctor) {
        throw new NotFoundException('Médico não encontrado');
      }
    }

    const range = { ...this.defaultRange(), ...(from && { from }), ...(to && { to }) };

    const fromDate = new Date(`${range.from}T00:00:00`);
    const toDate = new Date(`${range.to}T23:59:59.999`);
    if (
      Number.isNaN(fromDate.getTime()) ||
      Number.isNaN(toDate.getTime()) ||
      fromDate > toDate
    ) {
      throw new BadRequestException('Intervalo de datas inválido');
    }

    const totalDias = Math.round(
      (toDate.getTime() - fromDate.getTime()) / (24 * 60 * 60 * 1000),
    );
    if (totalDias > MAX_DIAS_INTERVALO) {
      throw new BadRequestException(
        `Intervalo máximo permitido é de ${MAX_DIAS_INTERVALO} dias`,
      );
    }

    const prescricoes = await this.prescricaoRepo.find({
      where: { id_paciente: { id_user: idPaciente } },
    });

    const prescricaoWindows: PrescricaoWindow[] = prescricoes.map((p) => ({
      inicio: toLisbonDateKey(p.data_inicio),
      fim: toLisbonDateKey(p.data_validade ?? toDate),
      frequenciaSemanal: p.frequencia_semanal,
    }));

    const sessoesRaw = await this.sessaoRepo.find({
      where: {
        id_paciente: { id_user: idPaciente },
        data_hora: Between(fromDate, toDate),
      },
      relations: { id_exercicio: true },
      order: { data_hora: 'ASC' },
    });

    const sessoes: SessaoParaHistorico[] = sessoesRaw.map((s) => ({
      idSessao: s.id_sessao,
      nomeExercicio: s.id_exercicio?.nome_exercicio ?? 'Exercício',
      status: s.status,
      esforco: s.esforco_1_a_10 ?? null,
      diversao: s.diversao_1_a_5 ?? null,
      duracaoSegundos: s.duracao ?? null,
      dataHora: s.data_hora,
      teveProblemas: s.teve_problemas ?? false,
      participacaoFamiliares: s.participacao_familiares ?? false,
      fcMaxima: s.fc_maxima ?? null,
      fcMedia: s.fc_media ?? null,
    }));

    const hoje = toLisbonDateKey(new Date());

    return deriveHistorico(sessoes, prescricaoWindows, range.from, range.to, hoje);
  }

  async getPacientesComAdesao(medicoId?: string): Promise<PacienteComAdesao[]> {
    if (medicoId) {
      const doctor = await this.utilizadorRepo.findOne({ where: { id_user: medicoId } });
      if (doctor) {
        console.log(`[getPacientesComAdesao] Médico encontrado: ${doctor.email}`);
      } else {
        console.log(`[getPacientesComAdesao] Médico ID ${medicoId} não encontrado na DB`);
      }
    } else {
      console.log(`[getPacientesComAdesao] Sem medicoId (Unit Tests?)`);
    }

    const whereCondition: FindOptionsWhere<Utilizador> = { tipo_utilizador: UserRole.PACIENTE };

    console.log('[getPacientesComAdesao] Condição da Query:', whereCondition);

    const pacientes = await this.utilizadorRepo.find({
      where: whereCondition,
      order: { nome: 'ASC' },
    });

    console.log(`[getPacientesComAdesao] Pacientes encontrados (${pacientes.length}):`, pacientes.map(p => p.nome));
    if (pacientes.length === 0) {
      return [];
    }

    const idsPacientes = pacientes.map((p) => p.id_user);

    const prescricoes = await this.prescricaoRepo.find({
      where: { id_paciente: { id_user: In(idsPacientes) } },
      relations: { id_paciente: true },
    });

    if (prescricoes.length === 0) {
      return pacientes.map((p) => this.paraPacienteComAdesao(p, null));
    }

    const earliestInicio = prescricoes.reduce(
      (min, p) => (p.data_inicio < min ? p.data_inicio : min),
      prescricoes[0].data_inicio,
    );

    const sessoesRaw = await this.sessaoRepo.find({
      where: {
        id_paciente: { id_user: In(idsPacientes) },
        data_hora: MoreThanOrEqual(earliestInicio),
      },
      relations: { id_paciente: true },
    });

    const prescricoesPorPaciente = new Map<string, Prescricao[]>();
    for (const p of prescricoes) {
      if (!p.id_paciente) continue;
      const idPaciente = p.id_paciente.id_user;
      const lista = prescricoesPorPaciente.get(idPaciente) ?? [];
      lista.push(p);
      prescricoesPorPaciente.set(idPaciente, lista);
    }

    const sessoesPorPaciente = new Map<string, SessaoParaHistorico[]>();
    for (const s of sessoesRaw) {
      const idPaciente = s.id_paciente.id_user;
      const lista = sessoesPorPaciente.get(idPaciente) ?? [];
      lista.push({
        idSessao: s.id_sessao,
        nomeExercicio: '',
        status: s.status,
        esforco: s.esforco_1_a_10 ?? null,
        diversao: s.diversao_1_a_5 ?? null,
        duracaoSegundos: s.duracao ?? null,
        dataHora: s.data_hora,
      });
      sessoesPorPaciente.set(idPaciente, lista);
    }

    const hoje = toLisbonDateKey(new Date());

    return pacientes.map((p) => {
      const prescricoesDoPaciente = prescricoesPorPaciente.get(p.id_user) ?? [];
      if (prescricoesDoPaciente.length === 0) {
        return this.paraPacienteComAdesao(p, null);
      }

      const windows: PrescricaoWindow[] = prescricoesDoPaciente.map((pr) => ({
        inicio: toLisbonDateKey(pr.data_inicio),
        fim: pr.data_validade ? toLisbonDateKey(pr.data_validade) : hoje,
        frequenciaSemanal: pr.frequencia_semanal,
      }));

      const { percentual } = calcularAdesao(
        sessoesPorPaciente.get(p.id_user) ?? [],
        windows,
        hoje,
      );

      return this.paraPacienteComAdesao(p, percentual);
    });
  }

  private paraPacienteComAdesao(
    paciente: Utilizador,
    adesaoPercentual: number | null,
  ): PacienteComAdesao {
    return {
      idUser: paciente.id_user,
      nome: paciente.nome,
      email: paciente.email,
      adesaoPercentual,
    };
  }
}
