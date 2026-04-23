import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

/**
 * SACRRA 700v2 Fixed-Width Formatters
 */

// Pad string to exact length (right-pad with spaces)
const padStr = (val: string | null | undefined, len: number) =>
  (val ?? '').substring(0, len).padEnd(len, ' ')

// Pad number to exact length (left-pad with zeros, whole Rands)
const padNum = (val: number | string | null | undefined, len: number) => {
    // Note: Spec 700v2 uses whole Rands. We divide cent-based input by 100.
    const num = Math.floor(Number(val ?? 0) / 100);
    return String(num).padStart(len, '0').substring(0, len);
}

Deno.serve(async (req) => {
  try {
    const { month_end_date } = await req.json() // Format: CCYYMMDD

    // 1. Fetch all active Personal Loan accounts (Type P)
    // Joins consumers for demographic fields
    const { data: accounts, error } = await supabase
      .from('accounts')
      .select(`
        *,
        consumers (*)
      `)
      .eq('account_type', 'P')
      .eq('active', true)

    if (error) throw error

    const lines: string[] = []

    // 2. HEADER record (Length: 700)
    // H [SupplierRef 10] [Identifier 4] [Version 2] [MonthEnd 8] [Filler 675]
    const header = [
      '01',                          // Record type
      padStr('AA0001    ', 10),      // Supplier ref (pad to 10)
      padStr('L702', 4),             // Layout identifier
      padStr('06', 2),               // Layout version
      padStr(month_end_date, 8),     // Month end date CCYYMMDD
      padStr('', 674),               // Filler to 700
    ].join('')
    lines.push(header)

    // 3. DATA records (Length: 700)
    for (const acc of accounts) {
      const consumer = acc.consumers || {}
      const record = [
        '02',                                          // Record type
        padStr('AA0001    ', 10),                      // Supplier ref
        padStr(consumer.sa_id, 13),                    // SA ID (Validated via Luhn in UI)
        padStr('', 13),                                // Non-SA ID
        padStr(consumer.date_of_birth, 8),             // DOB CCYYMMDD
        padStr(consumer.surname, 30),                  // Surname (Max 30 per guide)
        padStr(consumer.first_name, 20),               // First name / initials
        padStr('P', 1),                                // Account type (Mandatory P)
        padStr(acc.account_number, 20),                // Account number
        padStr(acc.branch_code ?? '', 6),              // Branch code
        padStr(acc.sub_account ?? '', 10),             // Sub account
        padStr(acc.opened_date, 8),                    // Account opened date
        padNum(acc.term, 3),                           // Term in months
        padNum(acc.instalment_amount, 9),              // Instalment
        padNum(acc.current_balance, 9),                // Current balance
        padNum(acc.arrears_amount, 9),                 // Arrears
        padStr(acc.status_code || '00', 2),            // Status code
        padStr(acc.payment_type || '01', 2),           // Payment type
        padStr(acc.last_payment_date ?? '00000000', 8),// Last payment date
        padNum(acc.last_payment_amount ?? 0, 9),       // Last payment amount
        padStr('', 523),                               // Filler to 700
      ].join('')
      lines.push(record)
    }

    // 4. TRAILER record (Length: 700)
    // T [TotalCount 9] [Filler 690]
    const trailer = [
      '99',
      padNum((accounts.length + 2) * 100, 9).substring(0,9), // Record count including H/T
      padStr('', 689),                                       // Filler
    ].join('')
    lines.push(trailer)

    const fileContent = lines.join('\r\n') // SACRRA requires CRLF
    
    return new Response(fileContent, {
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="SACRRA_P_${month_end_date}.txt"`,
      }
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
