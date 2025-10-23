const { Wallet } = require('ethers');
const pk = process.env.TEST_PK || "0xYOUR_TEST_PRIVATE_KEY"; // có thể tạm đưa vào .env (TEST_PK)
const wallet = new Wallet(pk);
const message = "Login at " + new Date().toISOString();
(async () => {
  const signature = await wallet.signMessage(message);
  console.log(JSON.stringify({ address: wallet.address, message, signature }, null, 2));
})();
