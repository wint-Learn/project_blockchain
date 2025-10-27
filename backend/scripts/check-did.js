require('dotenv').config();
const { Pool } = require('pg');
const ethers = require('ethers');

(async () => {
  const pool = new Pool({ connectionString: process.env.DB_CONNECTION_STRING });
  const addr = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';

  const db = await pool.query('SELECT id, wallet_address, cccd_number_hash FROM users WHERE LOWER(wallet_address) = $1', [addr.toLowerCase()]);
  
  console.log('📊 Wallet:', addr);
  console.log('DB:', db.rows.length > 0 ? `✅ Found (ID ${db.rows[0].id})` : '❌ NOT found');
  
  if (db.rows.length > 0) {
    console.log('   CCCD Hash:', db.rows[0].cccd_number_hash?.substring(0, 30) + '...');
  }

  const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
  const contract = new ethers.Contract(
    '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
    ['function publicKeys(address) view returns (bytes)'],
    provider
  );
  
  const pk = await contract.publicKeys(addr);
  console.log('Blockchain:', pk !== '0x' && pk.length > 2 ? `✅ Found (${pk.substring(0, 30)}...)` : '❌ NOT found');

  console.log('\n' + (db.rows.length > 0 && pk !== '0x' ? '✅ CAN LOGIN' : '❌ CANNOT LOGIN - Need to register'));

  await pool.end();
})();
