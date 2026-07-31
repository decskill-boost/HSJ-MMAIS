import { DataSource, SelectQueryBuilder } from 'typeorm';
import { Exercicio } from '../../entities/exercicio.entity';
import { Perfil } from '../../entities/perfil.entity';
import { Permissao } from '../../entities/permissao.entity';
import { Prescricao } from '../../entities/prescricao.entity';
import { PrescricaoExercicio } from '../../entities/prescricao-exercicio.entity';
import { SessaoRealizada } from '../../entities/sessao-realizada.entity';
import { Utilizador } from '../../entities/utilizador.entity';
import {
  IDS_PLANOS_PUBLICOS,
  PlanosLeituraService,
} from '../planos-leitura.service';

/**
 * O SQL destas rotas é escrito à mão (o `Prescricao` não tem o lado `@OneToMany`
 * para `PrescricaoExercicio`, por isso não há relação para o TypeORM seguir).
 * Um erro aqui só aparecia em produção, e as regras de autorização de E1/E2/E3
 * VIVEM nestas cláusulas.
 *
 * Este teste constrói os metadados do TypeORM sem ligar a base de dados nenhuma
 * e lê o SQL que sairia. Não substitui um teste de integração, mas apanha
 * cláusulas em falta e colunas mal escritas.
 */
describe('SQL das consultas de leitura de planos', () => {
  const dataSource = new DataSource({
    type: 'postgres',
    entities: [
      Exercicio,
      Perfil,
      Permissao,
      Prescricao,
      PrescricaoExercicio,
      SessaoRealizada,
      Utilizador,
    ],
  });

  let servico: PlanosLeituraService;
  let sqlGerado: string[];
  let parametrosGerados: unknown[];

  beforeAll(async () => {
    await (
      dataSource as unknown as { buildMetadatas: () => Promise<void> }
    ).buildMetadatas();
    servico = new PlanosLeituraService(dataSource.getRepository(Prescricao));
  });

  beforeEach(() => {
    sqlGerado = [];
    parametrosGerados = [];
    jest
      .spyOn(SelectQueryBuilder.prototype, 'getRawMany')
      .mockImplementation(function (this: SelectQueryBuilder<object>) {
        const [query, parametros] = this.getQueryAndParameters() as [
          string,
          unknown[],
        ];
        sqlGerado.push(query);
        parametrosGerados.push(...parametros);
        return Promise.resolve([]);
      });
  });

  afterEach(() => jest.restoreAllMocks());

  const sql = () => sqlGerado.join('\n');

  it('E1 filtra pelo paciente e junta exercícios com LEFT JOIN', async () => {
    await servico.planosDoPaciente('id-da-crianca');

    expect(sql()).toContain('FROM "prescricoes"');
    expect(sql()).toContain('LEFT JOIN "prescricoes_exercicios"');
    expect(sql()).toContain('LEFT JOIN "exercicios"');
    expect(sql()).toContain('"p"."id_paciente" = $1');
    // O id da criança é o ÚNICO valor ligado à consulta.
    expect(parametrosGerados).toEqual(['id-da-crianca']);
    expect(sql()).toContain(
      'COALESCE("pe"."duracao_segundos", "e"."duracao_segundos")',
    );
    expect(sql()).toContain('ORDER BY "p"."data_inicio" DESC');
    // Um INNER JOIN perderia os planos sem exercícios.
    expect(sql()).not.toContain('INNER JOIN');
  });

  it('E2 impõe id_paciente IS NULL e ativo', async () => {
    await servico.planosStandard();

    expect(sql()).toContain('"p"."id_paciente" IS NULL');
    expect(sql()).toContain('"p"."ativo" = true');
    // Nada vindo de fora entra nesta consulta.
    expect(parametrosGerados).toEqual([]);
  });

  it('E3 restringe aos ids do servidor E exige id_paciente IS NULL', async () => {
    await servico.planosPublicos();

    expect(sql()).toMatch(/"p"\."id_prescricao" IN \(\$1, \$2\)/);
    expect(sql()).toContain('"p"."id_paciente" IS NULL');
    expect(sql()).toContain('"p"."ativo" = true');
    expect(parametrosGerados).toEqual([...IDS_PLANOS_PUBLICOS]);
  });

  it('E4 agrega numa consulta só, com o nome preso a contas de paciente', async () => {
    await servico.planosParaGestao();

    expect(sql()).toContain('LEFT JOIN "utilizadores"');
    expect(sql()).toContain('"u"."tipo_utilizador" = $1');
    expect(parametrosGerados).toEqual(['paciente']);
    expect(sql()).toContain('COUNT("pe"."id_exercicio")');
    expect(sql()).toContain('GROUP BY "p"."id_prescricao"');
    expect(sql()).toContain('ORDER BY "p"."data_inicio" DESC');
  });

  /**
   * Os planos que as crianças montam para si próprias não são atos clínicos e
   * não entram na lista de gestão. O critério é estrutural — o autor é o
   * próprio dono — e não o texto das notas médicas, que qualquer edição
   * desfazia (e que devolveria à lista todos os planos das crianças).
   */
  it('E4 exclui os planos montados pela própria criança, sem depender das notas', async () => {
    await servico.planosParaGestao();

    expect(sql()).toContain('"p"."id_medico" <> "p"."id_paciente"');
    expect(sql()).toContain('"p"."id_paciente" IS NULL');
    expect(sql()).not.toContain('notas_medicas" !=');
    // O nome do plano tem de sair da base: sem ele a lista mostrava sempre o
    // texto de reserva.
    expect(sql()).toContain('"p"."nome"');
  });

  it('E5 traz o nome, para o editor não o apagar ao guardar', async () => {
    await servico.planoParaEdicao('id-do-plano').catch(() => undefined);

    expect(sql()).toContain('"p"."nome"');
  });

  it('E5 lê a duração da prescrição sem COALESCE', async () => {
    await servico.planoParaEdicao('id-do-plano').catch(() => undefined);

    expect(sql()).toContain('"p"."id_prescricao" = $1');
    expect(sql()).toContain('"pe"."duracao_segundos"');
    expect(sql()).not.toContain('COALESCE');
  });
});
