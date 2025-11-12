# 🧪 TEST GUIDE - PHASE 2 BACKEND

## 📋 Checklist

- [x] ✅ Database migration hoàn tất
- [x] ✅ Backend API implemented
- [x] ✅ Routes mounted
- [ ] ⏳ ServiceRegistry contract deploy
- [ ] ⏳ Test endpoints

---

## 🚀 DEPLOY CONTRACT

```bash
cd blockchain
npx hardhat ignition deploy ignition/modules/ServiceRegistry.ts --network localhost
```

Lưu address vào `.env`:
```
SERVICE_CONTRACT_ADDRESS=0x...
```

---

## 🧪 TEST ENDPOINTS

### 1. Gửi yêu cầu
```bash
curl -X POST http://localhost:3000/api/services/request \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    "cccdNumber": "036202012356",
    "serviceType": "business_registration",
    "serviceData": {
      "businessName": "Cửa hàng ABC",
      "businessAddress": "123 Đường X"
    }
  }'
```

### 2. Xem yêu cầu user
```bash
curl http://localhost:3000/api/services/my-requests?walletAddress=0x70997970C51812dc3A010C7d01b50e0d17dc79C8
```

### 3. Admin xem pending
```bash
curl http://localhost:3000/api/services/admin/pending
```

### 4. Admin phê duyệt
```bash
curl -X POST http://localhost:3000/api/services/admin/approve/1 \
  -H "Content-Type: application/json" \
  -d '{
    "adminAddress": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
  }'
```

### 5. Admin từ chối
```bash
curl -X POST http://localhost:3000/api/services/admin/reject/2 \
  -H "Content-Type: application/json" \
  -d '{
    "adminAddress": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    "reason": "Thiếu giấy tờ"
  }'
```
