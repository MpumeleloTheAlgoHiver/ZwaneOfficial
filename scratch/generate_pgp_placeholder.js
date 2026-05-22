import * as openpgp from 'openpgp';

async function generateKeys() {
    const { publicKey, privateKey } = await openpgp.generateKey({
        type: 'ecc',
        curve: 'curve25519',
        userIDs: [{ name: 'SACRRA Test', email: 'compliance@zwane.example' }],
        format: 'armored'
    });

    console.log('--- PUBLIC KEY (FOR SUPABASE SECRET) ---');
    console.log(publicKey);
    console.log('\n--- PRIVATE KEY (FOR LOCAL DECRYPTION TEST) ---');
    console.log(privateKey);
}

generateKeys();
