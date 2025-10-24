const ethers = require('ethers');

const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');

async function checkBalance() {
  const address = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'; // Ganache account (0)
  const balance = await provider.getBalance(address);
  console.log('Ganache Account (0) Balance:', ethers.formatEther(balance), 'ETH');
  
  const blockNumber = await provider.getBlockNumber();
  console.log('Current Block Number:', blockNumber);
}

checkBalance();
