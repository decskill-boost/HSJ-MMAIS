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
    console.log('Creating delete policies...');
    
    // Policy for deleting from prescricoes
    await client.query(`
      CREATE POLICY "Corpo clinico elimina as suas prescricoes" ON prescricoes
      FOR DELETE
      TO authenticated
      USING (id_medico = auth.uid());
    `);
    
    // Policy for deleting from prescricoes_exercicios
    await client.query(`
      CREATE POLICY "Corpo clinico elimina exercicios associados" ON prescricoes_exercicios
      FOR DELETE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM prescricoes
          WHERE prescricoes.id_prescricao = prescricoes_exercicios.id_prescricao
          AND prescricoes.id_medico = auth.uid()
        )
      );
    `);
    
    console.log('Delete policies created successfully!');
  } catch (err) {
    console.error('Error creating delete policies:', err);
  } finally {
    await client.end();
  }
}

main();
