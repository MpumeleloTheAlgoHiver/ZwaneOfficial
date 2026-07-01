const { supabaseService } = require('./config/supabaseServer');
async function test() {
  const { count } = await supabaseService.from('loan_applications').select('*', { count: 'exact', head: true });
  console.log(`Total loan applications: ${count}`);
}
test();
