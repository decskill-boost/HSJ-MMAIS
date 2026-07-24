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
    console.log('Altering database foreign key constraints...');
    
    // 1. Alter constraint on prescricoes_exercicios to ON DELETE CASCADE
    console.log('Updating FK_32d444b65ab62f9b9b1d50c6466 (prescricoes_exercicios)...');
    await client.query(`
      ALTER TABLE prescricoes_exercicios
      DROP CONSTRAINT IF EXISTS "FK_32d444b65ab62f9b9b1d50c6466",
      ADD CONSTRAINT "FK_32d444b65ab62f9b9b1d50c6466"
      FOREIGN KEY (id_prescricao) REFERENCES prescricoes(id_prescricao)
      ON DELETE CASCADE;
    `);

    // 2. Alter constraint on sessoes_realizadas to ON DELETE SET NULL
    console.log('Updating FK_0efb5266b49e4eed8b33b28109c (sessoes_realizadas)...');
    await client.query(`
      ALTER TABLE sessoes_realizadas
      DROP CONSTRAINT IF EXISTS "FK_0efb5266b49e4eed8b33b28109c",
      ADD CONSTRAINT "FK_0efb5266b49e4eed8b33b28109c"
      FOREIGN KEY (id_prescricao) REFERENCES prescricoes(id_prescricao)
      ON DELETE SET NULL;
    `);

    console.log('Constraints altered successfully!');
  } catch (err) {
    console.error('Error altering constraints:', err);
  } finally {
    await client.end();
  }
}

main();
