const { createClient } = require('@supabase/supabase-client');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../public/user/.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function seed() {
    console.log("🚀 Starting SACRRA Showcase Seeding...");

    // 1. Seed Consumers
    const consumers = [
        { first_name: 'Thabo', surname: 'Mokoena', sa_id: '8501015800081' },
        { first_name: 'Nomvula', surname: 'Zwane', sa_id: '9205120123085' },
        { first_name: 'Pieter', surname: 'Botha', sa_id: '7811235012081' },
        { first_name: 'Sarah', surname: 'Naidoo', sa_id: '8806040124089' },
        { first_name: 'Lindiwe', surname: 'Sisulu', sa_id: '9507150156082' },
        { first_name: 'Kabelo', surname: 'Molefe', sa_id: '8203105123084' },
        { first_name: 'Johan', surname: 'Venter', sa_id: '7409215012087' },
        { first_name: 'Ayesha', surname: 'Khan', sa_id: '9102280123081' },
        { first_name: 'Bongani', surname: 'Dlamini', sa_id: '8712125123083' },
        { first_name: 'Elena', surname: 'Smith', sa_id: '9404050123086' }
    ];

    const { data: seededConsumers, error: cErr } = await supabase.from('consumers').upsert(consumers, { onConflict: 'sa_id' }).select();
    if (cErr) return console.error("Consumer Error:", cErr);
    console.log(`✅ Seeded ${seededConsumers.length} Consumers`);

    // 2. Seed Accounts
    const accounts = seededConsumers.map((c, i) => ({
        account_number: `ACC-900${i}`,
        consumer_id: c.id,
        current_balance: (Math.random() * 5000000 + 100000).toFixed(0),
        instalment_amount: 250000,
        status_code: '00'
    }));

    const { error: aErr } = await supabase.from('accounts').upsert(accounts, { onConflict: 'account_number' });
    if (aErr) return console.error("Account Error:", aErr);
    console.log("✅ Seeded 10 Active Accounts");

    // 3. Seed Rejections
    const rejections = [
        { account_number: 'ACC-9001', field_name: 'Surname', error_message: 'Mismatched identity record in bureau cache.', severity: 'Critical' },
        { account_number: 'ACC-9004', field_name: 'ID Number', error_message: 'Format violation: Invalid Luhn checksum.', severity: 'Warning' }
    ];
    await supabase.from('sacrra_rejections').upsert(rejections, { onConflict: 'account_number' });
    console.log("✅ Seeded Compliance Rejections");

    // 4. Seed Audit History
    const history = [
        { month_end: '2023-10', record_count: 1284502, status: 'ACCEPTED' },
        { month_end: '2023-09', record_count: 1281200, status: 'ACCEPTED' }
    ];
    await supabase.from('sacrra_extract_runs').upsert(history, { onConflict: 'month_end' });
    console.log("✅ Seeded Submission History");

    console.log("✨ Seeding Complete. Refresh your Dashboard!");
}

seed();
