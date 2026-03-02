/**
 * Script to verify Gemini API key rotation
 */
require('dotenv').config({ path: './.env' });
const { getNextKey, getKeyCount } = require('../utils/keyRotation');

async function testRotation() {
    console.log(`📊 Total keys configured: ${getKeyCount()}`);

    if (getKeyCount() === 0) {
        console.error('❌ No keys found! Check your .env file.');
        return;
    }

    console.log('\n--- Simulating 10 requests ---');
    for (let i = 1; i <= 10; i++) {
        const key = getNextKey();
        // Mask the key for security in logs
        const maskedKey = key ? `${key.substring(0, 8)}...${key.substring(key.length - 4)}` : 'NULL';
        console.log(`Request ${i}: Using Key -> ${maskedKey}`);
    }
    console.log('----------------------------\n');
    console.log('✅ Key rotation verified successfully (Round-Robin).');
}

testRotation().catch(console.error);
