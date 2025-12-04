import { ethers } from 'hardhat';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  const SERVICE_REGISTRY_ADDRESS = '0x09635F643e140090A9A8Dcd712eD6285858ceBef';
  
  // Address to add as admin
  const newAdminAddress = process.argv[2];
  
  if (!newAdminAddress) {
    console.error('Usage: npx hardhat run scripts/add-admin-to-contract.ts --network localhost <ADMIN_ADDRESS>');
    process.exit(1);
  }
  
  if (!ethers.isAddress(newAdminAddress)) {
    console.error('Invalid Ethereum address');
    process.exit(1);
  }
  
  // Get signer (must be contract owner)
  const [deployer] = await ethers.getSigners();
  console.log('Deployer address:', deployer.address);
  
  // Get contract instance
  const ServiceRegistry = await ethers.getContractAt('ServiceRegistry', SERVICE_REGISTRY_ADDRESS);
  
  // Check current owner
  const owner = await ServiceRegistry.owner();
  console.log('Contract owner:', owner);
  
  if (deployer.address.toLowerCase() !== owner.toLowerCase()) {
    console.error('You are not the contract owner. Only owner can add admins.');
    process.exit(1);
  }
  
  // Check if already admin
  const isAlreadyAdmin = await ServiceRegistry.isAdmin(newAdminAddress);
  if (isAlreadyAdmin) {
    console.log(`${newAdminAddress} is already an admin!`);
    process.exit(0);
  }
  
  
  // Add admin
  const tx = await ServiceRegistry.addAdmin(newAdminAddress);
  
  await tx.wait();
  
  // Verify
  await ServiceRegistry.isAdmin(newAdminAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
