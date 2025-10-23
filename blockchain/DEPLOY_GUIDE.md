# 🚀 Hướng Dẫn Deploy DIDRegistry lên Polygon Amoy Testnet

## Bước 1: Chuẩn bị API Key và Private Key

### 1.1. Lấy Alchemy API Key (KHUYÊN DÙNG)
1. Truy cập: https://dashboard.alchemy.com/
2. Đăng ký/Đăng nhập tài khoản
3. Tạo app mới:
   - Chọn: **Create new app**
   - Chain: **Polygon**
   - Network: **Polygon Amoy** (testnet)
4. Copy **API Key** từ dashboard

### 1.2. Hoặc lấy Infura API Key
1. Truy cập: https://infura.io/dashboard
2. Đăng ký/Đăng nhập
3. Create new API key
4. Chọn network: **Polygon Amoy**
5. Copy **Project ID** (đây chính là API key)

**Lưu ý**: Nếu dùng Infura, thay đổi URL trong `hardhat.config.ts`:
```typescript
url: `https://polygon-amoy.infura.io/v3/${process.env.ALCHEMY_API_KEY}`
```

### 1.3. Lấy Private Key từ MetaMask
1. Mở MetaMask
2. Click vào **3 chấm** (menu)
3. Chọn **Account details**
4. Click **Export private key**
5. Nhập password MetaMask
6. Copy private key (BẮT ĐẦU BẰNG 0x)

**⚠️ CẢNH BÁO**: KHÔNG BAO GIỜ chia sẻ private key với ai!

### 1.4. Lấy MATIC test miễn phí
1. Truy cập: https://faucet.polygon.technology/
2. Chọn network: **Polygon Amoy**
3. Paste địa chỉ ví MetaMask của bạn
4. Click **Submit** để nhận 0.5 MATIC

Hoặc thử các faucet khác:
- https://www.alchemy.com/faucets/polygon-amoy
- https://faucet.quicknode.com/polygon/amoy

## Bước 2: Cấu hình file .env

1. Copy file `.env.example` thành `.env`:
   ```powershell
   cp .env.example .env
   ```

2. Mở file `.env` và điền thông tin:
   ```env
   ALCHEMY_API_KEY=abc123xyz456  # API key từ Alchemy
   PRIVATE_KEY=0x1234567890abcdef...  # Private key từ MetaMask
   POLYGONSCAN_API_KEY=XYZ123  # (Tùy chọn) Để verify contract
   ```

## Bước 3: Compile Smart Contract

```powershell
npx hardhat compile
```

Nếu thành công, bạn sẽ thấy:
```
✓ Compiled 2 Solidity files successfully
```

## Bước 4: Chạy Test Local

```powershell
npx hardhat test
```

Đảm bảo tất cả test đều pass trước khi deploy.

## Bước 5: Deploy lên Polygon Amoy

```powershell
npx hardhat run scripts/deploy-did.ts --network polygonAmoy
```

Kết quả mong đợi:
```
🚀 Bắt đầu deploy DIDRegistry contract...
📝 Deploying với địa chỉ: 0xYourAddress...
💰 Số dư tài khoản: 0.5 MATIC

⏳ Đang deploy DIDRegistry...
✅ DIDRegistry đã được deploy tại địa chỉ: 0xContractAddress...

📋 Thông tin deploy:
   - Contract address: 0x...
   - Deployer address: 0x...
   - Network: polygonAmoy
   - Chain ID: 80002

🔍 Xem contract trên explorer:
   https://amoy.polygonscan.com/address/0x...
```

## Bước 6: Verify Contract (Tùy chọn)

Verify giúp người khác có thể đọc source code của contract trên PolygonScan.

### 6.1. Lấy PolygonScan API Key
1. Truy cập: https://polygonscan.com/myapikey
2. Đăng ký/Đăng nhập
3. Tạo API key mới
4. Copy và paste vào file `.env`

### 6.2. Chạy lệnh verify
```powershell
npx hardhat verify --network polygonAmoy <CONTRACT_ADDRESS>
```

Thay `<CONTRACT_ADDRESS>` bằng địa chỉ contract vừa deploy.

## Bước 7: Test Contract trên Testnet

Bạn có thể tương tác với contract qua:

### 7.1. PolygonScan (Web UI)
1. Truy cập: https://amoy.polygonscan.com/address/YOUR_CONTRACT_ADDRESS
2. Tab **Contract** -> **Write Contract**
3. Connect MetaMask và gọi các function như `createDID`

### 7.2. Hardhat Console
```powershell
npx hardhat console --network polygonAmoy
```

Trong console:
```javascript
const DIDRegistry = await ethers.getContractFactory("DIDRegistry");
const did = await DIDRegistry.attach("YOUR_CONTRACT_ADDRESS");

// Tạo DID
await did.createDID("QmHashExample", "0x123...");

// Verify signature
await did.verifySignature(userAddress, messageHash, signature);
```

## ❌ Xử Lý Lỗi Thường Gặp

### Lỗi: "insufficient funds for intrinsic transaction cost"
**Nguyên nhân**: Không đủ MATIC để trả gas fee
**Giải pháp**: Lấy thêm MATIC từ faucet (Bước 1.4)

### Lỗi: "Invalid API Key"
**Nguyên nhân**: API key sai hoặc chưa điền vào `.env`
**Giải pháp**: Kiểm tra lại API key trong file `.env`

### Lỗi: "nonce has already been used"
**Nguyên nhân**: Transaction bị trùng nonce
**Giải pháp**: 
```powershell
npx hardhat clean
```
Hoặc đợi vài phút rồi thử lại

### Lỗi: "Error: could not detect network"
**Nguyên nhân**: Không kết nối được với RPC endpoint
**Giải pháp**: 
- Kiểm tra kết nối internet
- Thử dùng Infura thay vì Alchemy (hoặc ngược lại)
- Kiểm tra API key đã đúng chưa

## 📚 Tài Liệu Tham Khảo

- Polygon Docs: https://docs.polygon.technology/
- Hardhat Docs: https://hardhat.org/docs
- Alchemy Docs: https://docs.alchemy.com/
- PolygonScan: https://amoy.polygonscan.com/

## 🔐 Bảo Mật

- ✅ File `.env` đã được thêm vào `.gitignore`
- ✅ KHÔNG commit file `.env` lên Git
- ✅ KHÔNG share private key với ai
- ✅ Dùng ví test riêng, không dùng ví chính

## 💡 Lưu Ý Quan Trọng

1. **Polygon Amoy** là testnet mới thay thế Mumbai (Mumbai sẽ dừng hoạt động)
2. MATIC trên testnet KHÔNG có giá trị thật
3. Sau khi test xong, có thể deploy lên Polygon Mainnet bằng cách:
   - Thêm cấu hình `polygon` trong `hardhat.config.ts`
   - Có MATIC thật trong ví
   - Chạy: `npx hardhat run scripts/deploy-did.ts --network polygon`

## 📞 Hỗ Trợ

Nếu gặp vấn đề, hãy:
1. Kiểm tra lại từng bước trong hướng dẫn
2. Đọc thông báo lỗi kỹ càng
3. Google lỗi cụ thể + "Hardhat Polygon"
4. Hỏi trên Discord/Forum của Polygon hoặc Hardhat
