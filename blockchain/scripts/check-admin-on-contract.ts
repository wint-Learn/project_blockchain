import { ethers } from 'hardhat';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  const SERVICE_REGISTRY_ADDRESS = '0x09635F643e140090A9A8Dcd712eD6285858ceBef';
  
  // Get contract instance
  const ServiceRegistry = await ethers.getContractAt('ServiceRegistry', SERVICE_REGISTRY_ADDRESS);
  
  // Check owner
  const owner = await ServiceRegistry.owner();
  console.log('\n📋 Contract Owner:', owner);
  
  // Check common admin addresses
  const adminAddresses = [
    '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
  ];
  
  console.log('\n🔍 Checking admin status:\n');
  
  for (const addr of adminAddresses) {
    const isAdmin = await ServiceRegistry.isAdmin(addr);
    console.log(`${isAdmin ? '✅' : '❌'} ${addr} - Admin: ${isAdmin}`);
  }
  
  console.log('\n💡 If your MetaMask wallet is not listed as admin, you need to add it using the addAdmin function.');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
