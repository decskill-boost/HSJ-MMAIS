const { Client } = require('pg');
const { createClient } = require('@supabase/supabase-js');

async function main() {
  const pgClient = new Client({
    host: 'aws-0-eu-west-3.pooler.supabase.com',
    port: 5432,
    user: 'postgres.pvhuezandbhtghsvjgux',
    password: 'QGHDFSBCgQ7wVqO8',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });
  await pgClient.connect();
  try {
    const res = await pgClient.query(`
      SELECT id_sessao, data_hora, status 
      FROM sessoes_realizadas 
      WHERE id_paciente = '50626e63-bde8-43f6-9492-b8f4addb0cce'
      ORDER BY data_hora DESC;
    `);
    console.log('Sessions in database:', res.rows);
  } finally {
    await pgClient.end();
  }
}

main();
