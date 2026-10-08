/**
 * Copia os vídeos dos exercícios do Supabase Storage para o bucket do GCS e
 * aponta o `url_video` de cada exercício para a cópia nova.
 *
 * A partir de service.srv/:
 *   node --env-file=.env.local scripts/migrar-videos-para-gcs.js            # só lista
 *   node --env-file=.env.local scripts/migrar-videos-para-gcs.js --aplicar  # copia e atualiza
 *
 * Usa as mesmas variáveis que o backend (DB_*, GCS_BUCKET, GCS_CREDENTIALS).
 * Pode correr-se mais do que uma vez: um objeto que já esteja no bucket não é
 * reescrito, e só se muda a linha depois de a cópia estar feita. Os ficheiros
 * no Supabase não são apagados.
 */
const { Client } = require('pg');
const { Storage } = require('@google-cloud/storage');
const { Readable } = require('node:stream');
const { pipeline } = require('node:stream/promises');

const APLICAR = process.argv.includes('--aplicar');
const CAMINHO_SUPABASE = '/storage/v1/object/public/exercise-videos/';

function obrigatoria(nome) {
  const valor = process.env[nome];
  if (!valor) throw new Error(`Falta a variável ${nome}.`);
  return valor;
}

function credenciais() {
  const valor = process.env.GCS_CREDENTIALS?.trim();
  if (!valor) return undefined;
  return JSON.parse(
    valor.startsWith('{')
      ? valor
      : Buffer.from(valor, 'base64').toString('utf8'),
  );
}

async function copiarParaGcs(urlOrigem, ficheiro) {
  const resposta = await fetch(urlOrigem);
  if (!resposta.ok || !resposta.body) {
    throw new Error(`download devolveu ${resposta.status}`);
  }

  try {
    await pipeline(
      Readable.fromWeb(resposta.body),
      ficheiro.createWriteStream({
        contentType: resposta.headers.get('content-type') ?? undefined,
        // Só escreve se o objeto ainda não existir.
        preconditionOpts: { ifGenerationMatch: 0 },
      }),
    );
    return 'copiado';
  } catch (err) {
    if (err.code === 412) return 'já estava no bucket';
    throw err;
  }
}

async function main() {
  const nomeBucket = obrigatoria('GCS_BUCKET');
  const bucket = new Storage({ credentials: credenciais() }).bucket(nomeBucket);

  const host = obrigatoria('DB_HOST');
  const db = new Client({
    host,
    port: Number(process.env.DB_PORT ?? 5432),
    user: obrigatoria('DB_USERNAME'),
    password: obrigatoria('DB_PASSWORD'),
    database: obrigatoria('DB_NAME'),
    ssl: ['localhost', '127.0.0.1'].includes(host)
      ? false
      : { rejectUnauthorized: false },
  });

  await db.connect();
  try {
    const { rows } = await db.query(
      `SELECT id_exercicio, nome_exercicio, url_video
         FROM exercicios
        WHERE url_video LIKE $1`,
      [`%${CAMINHO_SUPABASE}%`],
    );

    console.log(
      `${rows.length} exercício(s) com vídeo no Supabase` +
        (APLICAR ? '.' : ' (só a listar; --aplicar para migrar).'),
    );

    let falhas = 0;
    for (const { id_exercicio, nome_exercicio, url_video } of rows) {
      const nomeOriginal = decodeURIComponent(
        new URL(url_video).pathname.split(CAMINHO_SUPABASE)[1],
      );
      const objeto = `exercicios/${nomeOriginal}`;
      const urlNova = `https://storage.googleapis.com/${nomeBucket}/${objeto
        .split('/')
        .map(encodeURIComponent)
        .join('/')}`;

      console.log(`\n${nome_exercicio}\n  ${url_video}\n  → ${urlNova}`);
      if (!APLICAR) continue;

      try {
        console.log(`  ${await copiarParaGcs(url_video, bucket.file(objeto))}`);
        await db.query(
          'UPDATE exercicios SET url_video = $1 WHERE id_exercicio = $2',
          [urlNova, id_exercicio],
        );
        console.log('  url_video atualizado');
      } catch (err) {
        falhas += 1;
        console.error(`  ✗ ficou como estava: ${err.message}`);
      }
    }

    if (falhas > 0) {
      console.error(`\n${falhas} vídeo(s) por migrar — corre outra vez.`);
      process.exitCode = 1;
    }
  } finally {
    await db.end();
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exitCode = 1;
});
