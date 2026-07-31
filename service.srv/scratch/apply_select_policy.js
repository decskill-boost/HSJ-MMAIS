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
    console.log('Creating select policy on prescricoes_exercicios...');
    await client.query(`
      CREATE POLICY "Corpo clinico ve exercicios das prescricoes" ON prescricoes_exercicios
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM prescricoes
          WHERE prescricoes.id_prescricao = prescricoes_exercicios.id_prescricao
          AND prescricoes.id_medico = auth.uid()
        )
      );
    `);
    console.log('Policy created successfully!');
  } catch (err) {
    console.error('Error creating policy:', err);
  } finally {
    await client.end();
  }
}

main();
