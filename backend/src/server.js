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

// Body parser
app.use(bodyParser.json());

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

// Store dependencies in app.locals để routes/controllers có thể access
app.locals.pool = pool;
app.locals.provider = provider;
app.locals.contract = contract;
app.locals.logger = logger;

// ============ ROUTES ============

let healthRoutes, didRoutes, authRoutes, adminRoutes, verifyRoutes, serviceRoutes;
try {
  healthRoutes = require('./routes/health.routes');
  didRoutes = require('./routes/did.routes');
  authRoutes = require('./routes/auth.routes');
  adminRoutes = require('./routes/admin.routes');
  verifyRoutes = require('./routes/verify.routes');
  serviceRoutes = require('./routes/service.routes');
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
app.use('/api/services', serviceRoutes);

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
