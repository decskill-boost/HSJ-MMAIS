import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Exercicio } from '../../entities/exercicio.entity';
import { Perfil } from '../../entities/perfil.entity';
import { Prescricao } from '../../entities/prescricao.entity';
import { Permissao } from '../../entities/permissao.entity';
import {
  SessaoRealizada,
  SessaoStatus,
} from '../../entities/sessao-realizada.entity';
import { Utilizador } from '../../entities/utilizador.entity';

/**
 * O agregado de E9 escreve `sessao.id_paciente`, mas `id_paciente` é uma
 * RELAÇÃO (`@ManyToOne`), não uma coluna. Quem garante que aquilo vira a coluna
 * de junção `id_paciente` em SQL é a substituição de nomes do TypeORM — e um
 * erro aqui só apareceria com a base de dados ligada, em produção, na consulta
 * que serve o painel de todas as crianças.
 *
 * Este teste gera o SQL sem qualquer ligação (constrói só os metadados) e
 * confirma a forma da consulta: uma passagem, agrupada, restrita à coorte e a
 * sessões concluídas.
 */
describe('SQL do agregado de sessões (E9)', () => {
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'postgres',
      entities: [
        SessaoRealizada,
        Utilizador,
        Exercicio,
        Prescricao,
        Permissao,
        Perfil,
      ],
    });
    // `buildMetadatas` é protegido, mas é o único caminho para gerar SQL sem
    // abrir ligação à base de dados.
    await (
      dataSource as unknown as { buildMetadatas(): Promise<void> }
    ).buildMetadatas();
  });

  const construirSql = () =>
    dataSource
      .getRepository(SessaoRealizada)
      .createQueryBuilder('sessao')
      .select('sessao.id_paciente', 'idPaciente')
      .addSelect('MAX(sessao.data_hora)', 'ultimoTreino')
      .addSelect('COUNT(*)', 'total')
      .where('sessao.id_paciente IN (:...idsPacientes)', {
        idsPacientes: ['a', 'b'],
      })
      .andWhere('sessao.status = :status', { status: SessaoStatus.CONCLUIDO })
      .groupBy('sessao.id_paciente')
      .getSql();

  it('resolve a relação id_paciente para a coluna de junção', () => {
    const sql = construirSql();

    expect(sql).toContain('"sessao"."id_paciente"');
    // Se a substituição falhasse, sobrava o nome da propriedade sem tabela.
    expect(sql).not.toMatch(/[^."]id_paciente[^"]/);
  });

  it('agrupa, restringe à coorte e filtra por sessões concluídas', () => {
    const sql = construirSql();

    expect(sql).toContain('GROUP BY');
    expect(sql).toContain('MAX(');
    expect(sql).toContain('COUNT(*)');
    expect(sql).toMatch(/"sessao"\."id_paciente" IN \(/);
    expect(sql).toContain('"sessao"."status" =');
    // Sem JOINs: o agregado não pode arrastar a tabela de pessoas atrás.
    expect(sql).not.toContain('JOIN');
  });
});
