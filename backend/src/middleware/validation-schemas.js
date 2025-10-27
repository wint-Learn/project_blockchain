const { z } = require('zod');

/**
 * Schema cho CCCD data object
 * Validates Vietnamese Citizen ID information
 */
const cccdDataSchema = z.object({
  cccd_number: z.string()
    .min(12, 'CCCD number must be at least 12 characters')
    .max(12, 'CCCD number must be exactly 12 characters')
    .regex(/^\d+$/, 'CCCD number must contain only digits'),
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name is too long'),
  dob: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'DOB must be in format YYYY-MM-DD'),
  address: z.string()
    .min(1, 'Address is required')
    .max(500, 'Address is too long'),
  issued_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Issued date must be in format YYYY-MM-DD')
});

/**
 * Schema cho /api/register endpoint
 * Supports both legacy format (qrData) and MetaMask format (citizen fields)
 */
const registerSchema = z.union([
  // Legacy format (backward compatibility)
  z.object({
    qrData: z.string().min(1, 'QR data is required'),
    privateKey: z.string()
      .regex(/^0x[a-fA-F0-9]{64}$/, 'Private key must be 32-byte hex string with 0x prefix')
      .optional(),
    verificationToken: z.string().optional()
  }),
  // MetaMask format (current implementation)
  z.object({
    cccdNumber: z.string()
      .min(12, 'CCCD number must be at least 12 characters')
      .max(12, 'CCCD number must be exactly 12 characters')
      .regex(/^\d+$/, 'CCCD number must contain only digits'),
    fullName: z.string()
      .min(1, 'Full name is required')
      .max(100, 'Full name is too long'),
    dateOfBirth: z.string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be in format YYYY-MM-DD'),
    gender: z.string()
      .min(1, 'Gender is required'),
    address: z.string()
      .min(1, 'Address is required')
      .max(500, 'Address is too long'),
    issueDate: z.string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Issue date must be in format YYYY-MM-DD'),
    phoneNumber: z.string()
      .regex(/^0\d{9}$/, 'Phone number must be 10 digits starting with 0'),
    verificationToken: z.string().optional()
  })
]);

/**
 * Schema cho /api/login endpoint
 */
const loginSchema = z.object({
  address: z.string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
  qrData: z.string().min(1, 'QR data is required'), // Accept raw QR string
  message: z.string()
    .min(1, 'Message is required'),
  signature: z.string()
    .regex(/^0x[a-fA-F0-9]{130}$/, 'Signature must be 65-byte hex string (130 hex chars + 0x)')
});

/**
 * Middleware để validate request body với Zod schema
 * @param {z.ZodSchema} schema - Zod schema để validate
 * @returns {Function} Express middleware
 */
function validateRequest(schema) {
  return (req, res, next) => {
    try {
      // Parse và validate request body
      const validated = schema.parse(req.body);
      // Thay req.body bằng validated data (đã được sanitized)
      req.body = validated;
      next();
    } catch (error) {
      // Zod v4+ uses error.issues instead of error.errors
      const issues = error.issues || error.errors || [];
      
      if (error.name === 'ZodError' || issues.length > 0) {
        return res.status(400).json({
          error: 'Validation failed',
          details: issues.map(err => ({
            field: (err.path || []).join('.'),
            message: err.message || 'Invalid value'
          }))
        });
      }
      // Lỗi khác
      return res.status(400).json({
        error: 'Invalid request body',
        message: error.message || 'Unknown error'
      });
    }
  };
}

module.exports = {
  cccdDataSchema,
  registerSchema,
  loginSchema,
  validateRequest
};
