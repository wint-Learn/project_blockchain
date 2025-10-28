require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const ethers = require('ethers');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const logger = require('./config/logger');

const app = express();
const port = process.env.PORT || 3000;

// ============ SECURITY MIDDLEWARE ============

// Helmet
app.use(helmet());

// CORS
const corsOptions = {
  origin: process.env.CORS_ORIGINS 
    ? process.env.CORS_ORIGINS.split(',') 
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// Debug middleware - log tất cả requests
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url} - Origin: ${req.headers.origin || 'N/A'}`);
  next();
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parser with increased limit
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// 🔍 DEBUG: Log raw body
app.use((req, res, next) => {
  if (req.url === '/api/auth/register') {
    logger.info('🔍 MIDDLEWARE: Checking req.body after body-parser', {
      hasBody: !!req.body,
      bodyKeys: req.body ? Object.keys(req.body) : [],
      hasWalletAddress: !!req.body?.walletAddress,
      hasSignature: !!req.body?.signature,
      walletAddress: req.body?.walletAddress || 'MISSING',
      signatureLength: req.body?.signature?.length || 0
    });
  }
  next();
});

// ============ DATABASE & BLOCKCHAIN SETUP ============

// PostgreSQL
const pool = new Pool({ connectionString: process.env.DB_CONNECTION_STRING });
pool.connect()
  .then(() => logger.info('Connected to PostgreSQL'))
  .catch(err => {
    logger.error('PostgreSQL connection error:', err);
    // Continue running - some endpoints don't need DB
  });

// Blockchain setup
// Use Ganache for development, Polygon for production
const rpcUrl = process.env.NODE_ENV === 'production' 
  ? process.env.POLYGON_RPC_URL 
  : (process.env.LOCAL_RPC_URL || process.env.POLYGON_RPC_URL);

logger.info(`Using RPC: ${rpcUrl}`);

let provider, contract;
try {
  provider = new ethers.JsonRpcProvider(rpcUrl);
  const contractAddress = process.env.CONTRACT_ADDRESS;

  if (!contractAddress) {
    throw new Error('CONTRACT_ADDRESS not set in .env');
  }

  let abi;
  const DID_JSON_PATH = path.resolve(__dirname, '../../blockchain/artifacts/contracts/DIDRegistry.sol/DIDRegistry.json');
  try {
    if (fs.existsSync(DID_JSON_PATH)) {
      abi = require(DID_JSON_PATH).abi;
      logger.info('Loaded ABI from JSON file');
    } else {
      throw new Error('ABI not found');
    }
  } catch (_e) {
    logger.warn('Using fallback ABI');
    abi = [
      'function createDID(string _cccdHash, bytes _publicKey) public',
      'function verifySignature(address user, bytes32 messageHash, bytes signature) public pure returns (bool)',
      'function publicKeys(address) view returns (bytes)',
      'function cccdHashes(address) view returns (string)'
    ];
  }

  contract = new ethers.Contract(contractAddress, abi, provider);
  logger.info('Blockchain connection established', { contractAddress });
} catch (error) {
  logger.error('Blockchain setup error:', error.message);
  // Set dummy values to prevent crashes
  provider = null;
  contract = null;
}

// ServiceRegistry contract setup
let serviceContract;
try {
  const serviceContractAddress = process.env.SERVICE_CONTRACT_ADDRESS;
  
  if (serviceContractAddress && provider) {
    let serviceAbi;
    const SERVICE_JSON_PATH = path.resolve(__dirname, '../../blockchain/artifacts/contracts/ServiceRegistry.sol/ServiceRegistry.json');
    
    if (fs.existsSync(SERVICE_JSON_PATH)) {
      serviceAbi = require(SERVICE_JSON_PATH).abi;
      logger.info('Loaded ServiceRegistry ABI from JSON file');
    } else {
      logger.warn('ServiceRegistry ABI not found, using fallback');
      serviceAbi = [
        'function registerService(address _userAddress, bytes32 _cccdHash, string memory _serviceType, string memory _data) public returns (uint256)',
        'function revokeService(address _userAddress, uint256 _serviceId) public',
        'function getService(address _userAddress, uint256 _serviceId) public view returns (bytes32, string, string, uint256, address, bool)',
        'function getUserServiceCount(address _userAddress) public view returns (uint256)',
        'event ServiceRegistered(address indexed user, uint256 indexed serviceId, bytes32 cccdHash, string serviceType, uint256 timestamp)',
        'event ServiceApproved(address indexed user, uint256 indexed serviceId, address approvedBy, uint256 timestamp)',
      ];
    }
    
    serviceContract = new ethers.Contract(serviceContractAddress, serviceAbi, provider);
    logger.info('ServiceRegistry contract connected', { serviceContractAddress });
  } else {
    logger.warn('SERVICE_CONTRACT_ADDRESS not set, service features disabled');
    serviceContract = null;
  }
} catch (error) {
  logger.error('ServiceRegistry setup error:', error.message);
  serviceContract = null;
}

// Store dependencies in app.locals để routes/controllers có thể access
app.locals.pool = pool;
app.locals.provider = provider;
app.locals.contract = contract;
app.locals.serviceContract = serviceContract;
app.locals.logger = logger;

// ============ ROUTES ============

let healthRoutes, didRoutes, authRoutes, adminRoutes, verifyRoutes, serviceRoutes, servicesRoutes, userRoutes;
try {
  healthRoutes = require('./routes/health.routes');
  didRoutes = require('./routes/did.routes');
  authRoutes = require('./routes/auth.routes');
  adminRoutes = require('./routes/admin.routes');
  verifyRoutes = require('./routes/verify.routes');
  serviceRoutes = require('./routes/service.routes'); // Legacy route (wrapper for Phase 2)
  servicesRoutes = require('./routes/services.routes'); // 🆕 Public Services routes (Phase 2)
  userRoutes = require('./routes/user.routes'); // User routes
  logger.info('All routes loaded successfully');
} catch (error) {
  logger.error('Error loading routes:', error.message);
  logger.error('Stack:', error.stack);
  process.exit(1);
}

// Mount routes
app.use('/health', healthRoutes);
app.use('/api/did', didRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/verify', verifyRoutes);
app.use('/api/services', serviceRoutes); // Legacy routes (wrapper)
app.use('/api/user', userRoutes); // User routes

// Backward compatibility
const authController = require('./controllers/auth');
const { registerSchema, loginSchema, validateRequest } = require('./middleware/validation-schemas');
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true,
});
app.post('/api/register', authLimiter, validateRequest(registerSchema), authController.register);
app.post('/api/login', authLimiter, validateRequest(loginSchema), authController.login);

// Forward /api/logs to admin routes
const adminController = require('./controllers/admin');
const { auditMiddleware } = require('./middleware/audit-middleware');
app.get('/api/logs', auditMiddleware('view_logs', (req) => req.query.address || 'all'), adminController.getLoginLogs);

// ============ ERROR HANDLING ============

// 404 handler
app.use((req, res) => {
  logger.warn(`404 Not Found: ${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    path: req.path,
    body: req.body,
    ip: req.ip
  });
  
  res.status(err.status || 500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ============ START SERVER ============

app.listen(port, '0.0.0.0', () => {
  logger.info(`Backend running on port ${port}`);
  logger.info('📍 Routes:');
  logger.info('   GET  /health');
  logger.info('   GET  /api/did/:address');
  logger.info('   POST /api/auth/register');
  logger.info('   POST /api/auth/login');
  logger.info('   GET  /api/admin/logs');
  logger.info('   (Backward compat: /api/register, /api/login, /api/logs)');
});
