Hệ thống quản lý danh tính phi tập trung (DID) với CCCD và Blockchain.
## Quickstart Guide
Hướng dẫn nhanh để khởi động backend và frontend trong môi trường phát triển.
## Bước 1: Start Backend
Mở terminal mới:

```bash
cd backend
npm install
npm run dev
```
**Expected:**
```
Server is running on http://localhost:3000
Connected to PostgreSQL database
```
Backend ready tại http://localhost:3000

## Bước 2: Start Frontend
Mở terminal mới:

```bash
cd frontend
npm install
echo "VITE_API_URL=http://localhost:3000/api" > .env
npm run dev
```
**Expected:**
```
