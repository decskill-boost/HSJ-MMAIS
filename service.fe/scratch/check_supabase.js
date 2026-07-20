const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pvhuezandbhtghsvjgux.supabase.co';
const supabaseAnonKey = 'sb_publishable_sCd2PZS9eo_dg8SvgV8H8w_L37Jfb_h';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  const { data, error } = await supabase
    .from('sessoes_realizadas')
    .select('*')
    .limit(3);
  
  if (error) {
    console.error('Error fetching sessoes_realizadas:', error);
  } else {
    console.log('Sessoes realizadas:', JSON.stringify(data, null, 2));
  }
}

main();
