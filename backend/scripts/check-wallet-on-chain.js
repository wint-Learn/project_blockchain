/**
 * Check if wallet has DID on blockchain
 */

require('dotenv').config();
const ethers = require('ethers');
const fs = require('fs');
const path = require('path');

async function checkWallet() {
  const walletAddress = process.argv[2] || '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'; // Ganache #1
  
  console.log('🔍 Checking wallet:', walletAddress);
  
  // Connect to Ganache
  const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
  
  // Load contract
  const abiPath = path.join(__dirname, '../../blockchain/artifacts/contracts/DIDRegistry.sol/DIDRegistry.json');
  const contractJson = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
  const contract = new ethers.Contract(
    '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
    contractJson.abi,
    provider
  );
  
  try {
    // Check public key
    const publicKey = await contract.publicKeys(walletAddress);
    console.log('Public Key:', publicKey);
    console.log('Has DID?', publicKey.length > 2); // "0x" = no DID, otherwise has DID
    
    // Check CCCD hash
    const cccdHash = await contract.cccdHashes(walletAddress);
    console.log('CCCD Hash:', cccdHash || '(empty)');
    
    if (publicKey.length > 2) {
      console.log('\n❌ This wallet ALREADY HAS DID on blockchain!');
      console.log('You need to:');
      console.log('1. Use a different Ganache account (e.g., #2, #3)');
      console.log('2. OR restart Ganache to reset blockchain state');
    } else {
      console.log('\n✅ This wallet is CLEAN - can register DID');
    }
    
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkWallet();
