const { Client } = require('pg');

const client = new Client({
  host: 'aws-0-eu-west-3.pooler.supabase.com',
  port: 5432,
  user: 'postgres.pvhuezandbhtghsvjgux',
  password: 'QGHDFSBCgQ7wVqO8',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  try {
    // Query all standard prescriptions (where is_standard = true)
    const stdRes = await client.query(`
      SELECT id_prescricao, frequencia_semanal, notas_medicas, dificuldade, condicao_paciente 
      FROM prescricoes 
      WHERE is_standard = true;
    `);
    console.log('Standard prescriptions:', stdRes.rows);

    console.log('Done.');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

main();
