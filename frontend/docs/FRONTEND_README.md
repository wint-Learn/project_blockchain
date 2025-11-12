# Frontend - DID Blockchain System

Frontend cho hệ thống quản lý danh tính phi tập trung (DID) với CCCD và Blockchain.

## Tech Stack

- **React 18** + **TypeScript**
- **Vite** - Build tool
- **Material-UI (MUI)** - UI components
- **Zustand** - State management
- **React Router** - Routing
- **Axios** - HTTP client
- **Ethers.js** - Blockchain interaction
- **Notistack** - Toast notifications
- **Zod** - Validation

## Cấu trúc thư mục

```
src/
├── pages/          # Pages: Home, Register, Login, Dashboard
├── components/     # Reusable components: PrivateRoute
├── services/       # API calls: api.ts
├── utils/          # Utilities: crypto-utils.ts
├── store/          # Zustand stores: useAuthStore.ts
├── App.tsx         # Router chính
└── main.tsx        # Entry point
```

## Setup & Development

### 1. Cài đặt dependencies

```bash
npm install
```

### 2. Cấu hình môi trường

Tạo file `.env`:

```env
VITE_API_URL=http://localhost:3000/api
```

### 3. Chạy dev server

```bash
npm run dev
```

Frontend sẽ chạy tại: http://localhost:5173

### 4. Build production

```bash
npm run build
```

Output sẽ được tạo trong thư mục `dist/`.

## Features chính

### 1. **Register (Đăng ký)**
- Nhập QR data từ CCCD
- Tự động generate random wallet (address + private key)
- Call API `/api/auth/register`
- Lưu thông tin user vào Zustand store
- Hiển thị cảnh báo về lưu private key trong localStorage (DEMO ONLY)

### 2. **Login (Đăng nhập)**
- Nhập address, QR data, private key
- Sign message với private key
- Call API `/api/auth/login`
- Kiểm tra anomaly score và hiển thị cảnh báo nếu >0.5
- Redirect về Dashboard sau khi đăng nhập thành công

### 3. **Dashboard**
- Hiển thị thông tin DID (address, CCCD hash, ngày tạo)
- Hiển thị trạng thái blockchain (onChain)
- Hiển thị lịch sử hoạt động (logs) trong bảng
- Cảnh báo nếu có anomaly score cao

### 4. **Private Route Protection**
- Dashboard chỉ truy cập được khi đã đăng nhập
- Tự động redirect về `/login` nếu chưa đăng nhập

### 5. **Toast Notifications**
- Thông báo thành công/thất bại cho mọi action
- Cảnh báo anomaly score
- Feedback realtime cho user

### 6. **Loading States**
- Hiển thị CircularProgress khi chờ API
- Disable buttons khi đang loading
- UX mượt mà

## State Management (Zustand)

### Auth Store (`useAuthStore`)

```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  privateKey: string | null; // DEMO ONLY
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setPrivateKey: (key: string | null) => void;
  logout: () => void;
}
```

- State persist trong localStorage (trừ privateKey)
- Auto sync với API token

## Security Notes

### ⚠️ Private Key Management

**DEMO MODE:**
- Private key hiện được lưu trong Zustand state (không persist vào localStorage để tăng bảo mật)
- Có cảnh báo rõ ràng cho user trên UI

**PRODUCTION:**
- Không bao giờ lưu private key trong frontend
- Sử dụng MetaMask hoặc WalletConnect
- Implement Web3Modal để connect ví

### CORS & API

- Frontend call API qua axios instance
- Base URL cấu hình trong `.env`
- Tự động thêm token vào headers nếu có

## Testing Flow

1. **Start Backend**: `cd ../backend && node src/server.js`
2. **Start Frontend**: `npm run dev`
3. **Test Register**:
   - Truy cập http://localhost:5173/register
   - Nhập QR data bất kỳ (demo)
   - Click "Đăng ký"
   - Kiểm tra console log để lấy private key & address
4. **Test Login**:
   - Truy cập http://localhost:5173/login
   - Nhập address, QR data, private key từ bước 3
   - Click "Đăng nhập"
   - Redirect về Dashboard
5. **Test Dashboard**:
   - Xem thông tin DID
   - Xem logs table
   - Test logout

## Deploy

### Vercel (Recommended)

```bash
npm run build
vercel --prod
```

### Netlify

```bash
npm run build
netlify deploy --prod --dir=dist
```

### Environment Variables

Nhớ set `VITE_API_URL` trong deployment platform settings.

## Known Issues

- **Node.js version warning**: Vite 7.x yêu cầu Node 20.19+ hoặc 22.12+. Hiện tại dùng 22.10.0 vẫn chạy được nhưng có warning.
- **Private key storage**: Chỉ dùng cho demo, không dùng trong production.

## Next Steps

- [ ] Tích hợp MetaMask/WalletConnect
- [ ] Thêm form validation với Zod
- [ ] E2E testing với Cypress
- [ ] Responsive design cho mobile
- [ ] Internationalization (i18n)
- [ ] Dark mode toggle
- [ ] Advanced error handling

## API Endpoints

Tham khảo backend README: `../backend/README.md`

## License

MIT
