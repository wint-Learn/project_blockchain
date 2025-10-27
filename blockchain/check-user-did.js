/**
 * Check DID registration for user address on blockchain
 */

const ethers = require('ethers');

const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
const contractAddress = '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9';

// Contract ABI (chỉ cần functions cần query)
const abi = [
  'function publicKeys(address) view returns (bytes)',
  'function cccdToAddress(string) view returns (address)'
];

async function checkUserDID() {
  const contract = new ethers.Contract(contractAddress, abi, provider);
  
  const userAddress = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
  const cccdHash = '0x874aadb9e231b5c7c86439471fc1c5be88260995be47f72378c2ae5bcffb5f5d'; // Hash of 036202012346
  
  console.log('🔍 Checking DID registration on blockchain...\n');
  
  // 1. Check publicKey by address
  console.log(`1️⃣ Query publicKeys[${userAddress}]:`);
  const publicKey = await contract.publicKeys(userAddress);
  console.log(`   Public Key: ${publicKey}`);
  console.log(`   Length: ${publicKey.length} chars`);
  console.log(`   Has DID: ${publicKey !== '0x' && publicKey.length > 2 ? '✅ YES' : '❌ NO'}\n`);
  
  // 2. Check address by CCCD hash
  console.log(`2️⃣ Query cccdToAddress[${cccdHash}]:`);
  const mappedAddress = await contract.cccdToAddress(cccdHash);
  console.log(`   Mapped Address: ${mappedAddress}`);
  console.log(`   Is registered: ${mappedAddress !== '0x0000000000000000000000000000000000000000' ? '✅ YES' : '❌ NO'}`);
  console.log(`   Matches user: ${mappedAddress.toLowerCase() === userAddress.toLowerCase() ? '✅ YES' : '❌ NO'}\n`);
  
  // 3. Summary
  console.log('📊 Summary:');
  if (publicKey !== '0x' && publicKey.length > 2 && 
      mappedAddress.toLowerCase() === userAddress.toLowerCase()) {
    console.log(`   ✅ User ${userAddress} has DID registered!`);
    console.log(`   ✅ CCCD 036202012346 is mapped to this user!`);
  } else {
    console.log(`   ❌ DID not found or mapping incorrect`);
  }
}

checkUserDID().catch(console.error);
