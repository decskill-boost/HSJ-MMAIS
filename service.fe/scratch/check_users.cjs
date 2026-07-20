const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pvhuezandbhtghsvjgux.supabase.co';
const supabaseAnonKey = 'sb_publishable_sCd2PZS9eo_dg8SvgV8H8w_L37Jfb_h';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  const { data: users, error: errorUsers } = await supabase
    .from('utilizadores')
    .select('*');
  
  if (errorUsers) {
    console.error('Error fetching utilizadores:', errorUsers);
  } else {
    console.log('Utilizadores count:', users.length);
    console.log('Utilizadores sample:', JSON.stringify(users.slice(0, 2), null, 2));
  }
}

main();
