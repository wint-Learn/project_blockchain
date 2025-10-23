import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Bắt đầu deploy DIDRegistry contract...");

  // Lấy thông tin deployer
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying với địa chỉ:", deployer.address);

  // Kiểm tra số dư
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Số dư tài khoản:", ethers.formatEther(balance), "MATIC");

  if (balance === 0n) {
    console.error("❌ LỖI: Tài khoản không có MATIC để trả gas fee!");
    console.log("💡 Hướng dẫn lấy MATIC test:");
    console.log("   1. Truy cập: https://faucet.polygon.technology/");
    console.log("   2. Chọn mạng: Polygon Amoy");
    console.log("   3. Paste địa chỉ ví của bạn và nhận MATIC miễn phí");
    process.exit(1);
  }

  // Deploy contract
  console.log("\n⏳ Đang deploy DIDRegistry...");
  const DIDRegistry = await ethers.getContractFactory("DIDRegistry");
  const didRegistry = await DIDRegistry.deploy();

  await didRegistry.waitForDeployment();

  const address = await didRegistry.getAddress();
  console.log("✅ DIDRegistry đã được deploy tại địa chỉ:", address);

  // Lưu địa chỉ contract để sử dụng sau
  console.log("\n📋 Thông tin deploy:");
  console.log("   - Contract address:", address);
  console.log("   - Deployer address:", deployer.address);
  console.log("   - Network:", (await ethers.provider.getNetwork()).name);
  console.log("   - Chain ID:", (await ethers.provider.getNetwork()).chainId);

  console.log("\n🔍 Xem contract trên explorer:");
  console.log(`   https://amoy.polygonscan.com/address/${address}`);

  console.log("\n💡 Để verify contract, chạy lệnh:");
  console.log(`   npx hardhat verify --network polygonAmoy ${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Lỗi khi deploy:", error);
    process.exit(1);
  });
