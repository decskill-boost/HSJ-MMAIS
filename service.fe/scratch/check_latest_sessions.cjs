const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pvhuezandbhtghsvjgux.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2aHVlemFuZGJodGdoc3ZqZ3V4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTY4NTkyMiwiZXhwIjoyMDk3MjYxOTIyfQ.OkldSn_S8_ZhfRRsvcIp8qH3-8gw2O_ZWK3Mey9_Rck';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function main() {
  const { data: sessoes, error } = await supabase
    .from('sessoes_realizadas')
    .select('id_paciente, data_hora, esforco_1_a_10, diversao_1_a_5, fc_media, fc_maxima, teve_problemas')
    .order('data_hora', { ascending: false });
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Sessoes:', sessoes);
  }
}

main();
