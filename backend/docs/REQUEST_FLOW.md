# Request Flow - MVC Architecture

## 📊 Visual Diagram

### Before (Monolithic)

```
Client Request
    │
    ▼
┌─────────────────────────────────────────┐
│         server.js (304 lines)           │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ Security Middleware               │ │
│  └───────────────────────────────────┘ │
│  ┌───────────────────────────────────┐ │
│  │ Route: GET /health                │ │
│  │   → Health check logic            │ │
│  └───────────────────────────────────┘ │
│  ┌───────────────────────────────────┐ │
│  │ Route: GET /api/did/:address      │ │
│  │   → Query blockchain + DB logic   │ │
│  └───────────────────────────────────┘ │
│  ┌───────────────────────────────────┐ │
│  │ Route: POST /api/register         │ │
│  │   → Hash, TX, Encrypt, Save logic │ │
│  └───────────────────────────────────┘ │
│  ┌───────────────────────────────────┐ │
│  │ Route: POST /api/login            │ │
│  │   → Verify, Log, Anomaly logic    │ │
│  └───────────────────────────────────┘ │
│  ┌───────────────────────────────────┐ │
│  │ Route: GET /api/logs              │ │
│  │   → Query logs logic              │ │
│  └───────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
    │
    ▼
Client Response
```

**Problem:** Tất cả logic trong 1 file → khó maintain, khó scale


### After (MVC Pattern)

```
Client Request: POST /api/auth/register
    │
    ▼
┌───────────────────────────────────────────────────────────┐
│                    server.js (137 lines)                  │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │           Global Security Middleware                 │ │
│  │  • Helmet (HTTP headers)                            │ │
│  │  • CORS (origin whitelist)                          │ │
│  │  • Rate Limiter (100 req/15min)                     │ │
│  │  • Body Parser (JSON)                               │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │           Database & Blockchain Setup                │ │
│  │  • PostgreSQL pool                                   │ │
│  │  • Ethers.js provider                               │ │
│  │  • DIDRegistry contract                             │ │
│  │  • Store in app.locals                              │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │                 Mount Routes                         │ │
│  │  • app.use('/health', healthRoutes)                 │ │
│  │  • app.use('/api/did', didRoutes)                   │ │
│  │  • app.use('/api/auth', authRoutes) ◄────┐          │ │
│  │  • app.use('/api/admin', adminRoutes)    │          │ │
│  └──────────────────────────────────────────┼──────────┘ │
└───────────────────────────────────────────────┼───────────┘
                                                │
                ┌───────────────────────────────┘
                │
                ▼
┌───────────────────────────────────────────────────────────┐
│          src/routes/auth.routes.js (33 lines)             │
│                                                           │
│  const router = express.Router();                         │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  POST /register                                      │ │
│  │    → authLimiter (10 req/15min)                     │ │
│  │    → validateRequest(registerSchema)                │ │
│  │    → authController.register  ◄──────────┐          │ │
│  └──────────────────────────────────────────┼──────────┘ │
│                                              │            │
│  ┌─────────────────────────────────────────┼──────────┐ │
│  │  POST /login                             │          │ │
│  │    → authLimiter                         │          │ │
│  │    → validateRequest(loginSchema)        │          │ │
│  │    → authController.login                │          │ │
│  └──────────────────────────────────────────┘          │ │
│                                                         │ │
└─────────────────────────────────────────────────────────┘ │
                                                            │
                ┌───────────────────────────────────────────┘
                │
                ▼
┌───────────────────────────────────────────────────────────┐
│       src/controllers/auth.controller.js (171 lines)      │
│                                                           │
│  exports.register = async (req, res) => {                 │
│                                                           │
│    ┌────────────────────────────────────────────────┐    │
│    │ 1. Extract dependencies                        │    │
│    │    const { pool, contract } = req.app.locals   │    │
│    │    const { cccdData, privateKey } = req.body   │    │
│    └────────────────────────────────────────────────┘    │
│                          │                                │
│                          ▼                                │
│    ┌────────────────────────────────────────────────┐    │
│    │ 2. Hash CCCD data (utils/crypto-utils)        │    │
│    │    const cccdHash = hashCCCD(cccdData)         │    │
│    └────────────────────────────────────────────────┘    │
│                          │                                │
│                          ▼                                │
│    ┌────────────────────────────────────────────────┐    │
│    │ 3. Send blockchain transaction                 │    │
│    │    const tx = contract.createDID(cccdHash, pk) │    │
│    │    const receipt = await tx.wait()             │    │
│    └────────────────────────────────────────────────┘    │
│                          │                                │
│                          ▼                                │
│    ┌────────────────────────────────────────────────┐    │
│    │ 4. Encrypt metadata (utils/crypto-utils)      │    │
│    │    const encrypted = encrypt(JSON.stringify()) │    │
│    └────────────────────────────────────────────────┘    │
│                          │                                │
│                          ▼                                │
│    ┌────────────────────────────────────────────────┐    │
│    │ 5. Save to PostgreSQL                          │    │
│    │    await pool.query(INSERT INTO users...)      │    │
│    └────────────────────────────────────────────────┘    │
│                          │                                │
│                          ▼                                │
│    ┌────────────────────────────────────────────────┐    │
│    │ 6. Return response                             │    │
│    │    res.json({ success, txHash, blockNumber })  │    │
│    └────────────────────────────────────────────────┘    │
│                                                           │
│  };                                                       │
│                                                           │
└───────────────────────────────────────────────────────────┘
                          │
                          ▼
                  Client Response
```

**Benefits:** 
- Clear separation: Routes define endpoints, Controllers contain logic
- Easy to test: Mock req/res, test controller directly
- Easy to extend: Add new endpoint without touching existing code


## 🔄 Complete Request Lifecycle

### Example: POST /api/auth/register

```
┌─────────────────────────────────────────────────────────────────┐
│ Step 1: Client sends request                                    │
│ POST http://localhost:3000/api/auth/register                    │
│ Body: { cccdData: {...}, privateKey: "0x..." }                  │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 2: Express middleware stack (server.js)                    │
│  ✓ Helmet: Add security headers                                 │
│  ✓ CORS: Check origin whitelist                                 │
│  ✓ Rate limiter: Check if IP exceeded 100 req/15min             │
│  ✓ Body parser: Parse JSON body                                 │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 3: Route matching (server.js)                              │
│  • Match: /api/auth/*                                            │
│  • Forward to authRoutes                                         │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 4: Auth routes (auth.routes.js)                            │
│  • Match: POST /register                                         │
│  • Apply authLimiter: Check 10 req/15min for this endpoint      │
│  • Apply validateRequest: Zod schema validation                 │
│    - cccdData must have: cccdNumber, fullName, dob, address     │
│    - privateKey must be hex string                              │
│  ✓ Validation passed                                            │
│  • Call authController.register(req, res)                       │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 5: Auth controller - register() (auth.controller.js)       │
│                                                                  │
│  5.1: Extract dependencies from app.locals                      │
│       pool, contract from req.app.locals                         │
│       cccdData, privateKey from req.body                         │
│                                                                  │
│  5.2: Hash CCCD data                                            │
│       hashCCCD(cccdData) → Keccak256 hash                       │
│                                                                  │
│  5.3: Create blockchain transaction                             │
│       wallet = new Wallet(privateKey, provider)                 │
│       tx = contract.createDID(cccdHash, wallet.publicKey)       │
│       receipt = await tx.wait()                                 │
│                                                                  │
│  5.4: Encrypt CCCD metadata                                     │
│       encrypted = encrypt(JSON.stringify(cccdData))             │
│                                                                  │
│  5.5: Save to database                                          │
│       INSERT INTO users (address, hash, encrypted_data)         │
│       ON CONFLICT UPDATE                                        │
│                                                                  │
│  5.6: Return response                                           │
│       res.json({ success: true, txHash, blockNumber, ... })     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 6: Response sent to client                                 │
│ Status: 200 OK                                                   │
│ Body: {                                                          │
│   success: true,                                                 │
│   txHash: "0xabc...",                                            │
│   blockNumber: 12345,                                            │
│   walletAddress: "0x123...",                                     │
│   cccdHash: "0xdef..."                                           │
│ }                                                                │
└─────────────────────────────────────────────────────────────────┘
```

### Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ If error occurs in controller...                                │
│ try {                                                            │
│   // ... business logic                                          │
│ } catch (error) {                                                │
│   res.status(500).json({ error: error.message })                │
│ }                                                                │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│ If error not caught...                                           │
│ Express global error handler (server.js)                         │
│ app.use((err, req, res, next) => {                              │
│   console.error('Unhandled error:', err)                         │
│   res.status(500).json({ error: 'Internal server error' })      │
│ })                                                               │
└─────────────────────────────────────────────────────────────────┘
```

## 🎯 Middleware Stack

### Global Middleware (Applied to all routes)

```
server.js
  │
  ├─ helmet()                    # Security headers
  ├─ cors(corsOptions)           # CORS policy
  ├─ limiter                     # 100 req/15min per IP
  └─ bodyParser.json()           # Parse JSON body
```

### Route-specific Middleware

```
auth.routes.js
  │
  ├─ POST /register
  │   ├─ authLimiter             # 10 req/15min (stricter)
  │   ├─ validateRequest()       # Zod schema validation
  │   └─ authController.register # Business logic
  │
  └─ POST /login
      ├─ authLimiter
      ├─ validateRequest()
      └─ authController.login

admin.routes.js
  │
  └─ GET /logs
      ├─ auditMiddleware()       # Log admin action to audit_logs
      └─ adminController.getLoginLogs
```

## 📦 Dependency Injection via app.locals

Instead of exporting/importing pool, provider, contract everywhere:

**server.js (Setup once):**
```javascript
const pool = new Pool({ connectionString: process.env.DB_CONNECTION_STRING });
const provider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL);
const contract = new ethers.Contract(contractAddress, abi, provider);

// Store in app.locals
app.locals.pool = pool;
app.locals.provider = provider;
app.locals.contract = contract;
```

**Controllers (Access via req.app.locals):**
```javascript
// auth.controller.js
exports.register = async (req, res) => {
  const { pool, contract } = req.app.locals;
  // Now we can use pool and contract
};

// did.controller.js
exports.getDIDInfo = async (req, res) => {
  const { pool, contract } = req.app.locals;
  // Access shared dependencies
};
```

**Benefits:**
- ✅ Single source of truth (server.js)
- ✅ No circular dependencies
- ✅ Easy to mock for testing
- ✅ Clean dependency injection pattern

## 🧪 Testing Strategy

### Unit Test - Controller

```javascript
// tests/unit/auth.controller.test.js
const authController = require('../../src/controllers/auth.controller');

describe('authController.register', () => {
  it('should hash CCCD, send tx, encrypt, and save', async () => {
    // Mock req
    const req = {
      body: {
        cccdData: { cccdNumber: '123', fullName: 'Test' },
        privateKey: '0xabc...'
      },
      app: {
        locals: {
          pool: mockPool,
          contract: mockContract
        }
      }
    };
    
    // Mock res
    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    
    // Call controller
    await authController.register(req, res);
    
    // Assert
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true })
    );
  });
});
```

### Integration Test - Full Flow

```javascript
// tests/integration/auth.test.js
const request = require('supertest');
const app = require('../../src/server');

describe('POST /api/auth/register', () => {
  it('should register DID successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        cccdData: { cccdNumber: '123', fullName: 'Test' },
        privateKey: '0xabc...'
      });
    
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('txHash');
  });
});
```

---

**Documentation by:** GitHub Copilot  
**Date:** 2025-01-23
