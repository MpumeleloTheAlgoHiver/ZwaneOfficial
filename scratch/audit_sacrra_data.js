import { supabase } from './public/admin/src/services/supabaseClient.js';

async function auditSchema() {
    console.log("🔍 Starting SACRRA Compliance Audit...");
    
    // 1. Check Profiles Schema
    const { data: profileColumns } = await supabase.rpc('get_table_columns', { table_name: 'profiles' });
    console.log("Profiles Columns:", profileColumns);

    // 2. Check Loans Schema
    const { data: loanColumns } = await supabase.rpc('get_table_columns', { table_name: 'loans' });
    console.log("Loans Columns:", loanColumns);

    // 3. Check for Data Gaps (Null IDs or Names)
    const { count: missingId } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).is('identity_number', null);
    const { count: missingName } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).is('full_name', null);
    
    console.log("--- COMPLIANCE GAPS ---");
    console.log(`Missing ID Numbers: ${missingId}`);
    console.log(`Missing Names: ${missingName}`);
}

auditSchema();
