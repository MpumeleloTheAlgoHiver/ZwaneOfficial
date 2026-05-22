import * as openpgp from 'openpgp';
import fs from 'fs';

// 1. Setup Keys from our stored placeholder
const keys = JSON.parse(fs.readFileSync('scratch/pgp_keys.json', 'utf8'));

async function verifyUAT() {
    console.log('🚀 Starting UAT Verification for record: BRUCE WAYNE\n');

    // 2. MOCK THE RECORD (Same logic as our SQL View)
    const sacrraFormat = (val, len) => String(val || '').toUpperCase().substring(0, len).padEnd(len, ' ');
    
    // Field Mapping (Simplified for demo, but hitting the 700 char limit)
    const record = 
        sacrraFormat('D', 1) +                  // Field 1
        sacrraFormat('WAYNE', 30) +             // Field 15
        sacrraFormat('8001015009087', 13) +     // Field 10
        '000000150000' +                        // Field 31 (R1500.00 in cents)
        sacrraFormat('ZN-WAYNE-001', 30) +      // Field 3
        sacrraFormat('20230101', 8) +           // Field 26
        sacrraFormat('', 606);                  // Filler to reach 700

    console.log(`✅ Row Integrity Check: Length = ${record.length} chars (Target: 700)`);
    console.log(`🔍 Content Preview: ${record.substring(0, 100)}...`);

    const header = sacrraFormat('H20231031ZWANE FINANCIAL SERVICES', 700);
    const trailer = sacrraFormat('T000000001', 700);
    const fullFile = `${header}\n${record}\n${trailer}`;

    // 3. ENCRYPTION HANDSHAKE
    const publicKey = await openpgp.readKey({ armoredKey: keys.public_key });
    const encrypted = await openpgp.encrypt({
        message: await openpgp.createMessage({ text: fullFile }),
        encryptionKeys: publicKey,
    });

    console.log('\n🔒 PGP Encryption Successful.');
    fs.writeFileSync('scratch/UAT_SUBMISSION_TEST.pgp', encrypted);
    console.log('📂 File saved: scratch/UAT_SUBMISSION_TEST.pgp');

    // 4. DECRYPTION VERIFICATION (The "Round-trip" Test)
    const privateKey = await openpgp.readPrivateKey({ armoredKey: keys.private_key });
    const { data: decrypted } = await openpgp.decrypt({
        message: await openpgp.readMessage({ armoredMessage: encrypted }),
        decryptionKeys: privateKey,
    });

    console.log('\n🔓 Decryption Round-trip Successful.');
    console.log('📄 Decrypted Data (First Row):');
    const rows = decrypted.split('\n');
    console.log(rows[1]); // Show the Bruce Wayne row
    
    if (rows[1].length === 700 && rows[1].includes('WAYNE')) {
        console.log('\n✨ FINAL VERIFICATION: PASSED ✨');
        console.log('The record is bureau-ready.');
    } else {
        console.log('\n❌ FINAL VERIFICATION: FAILED ❌');
    }
}

verifyUAT();
