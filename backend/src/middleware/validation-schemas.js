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
 * NOTE: privateKey sẽ được loại bỏ trong tương lai (client-side signing)
 */
const registerSchema = z.object({
  cccdData: cccdDataSchema,
  // privateKey tạm thời cho demo, sẽ được thay bằng signed transaction
  privateKey: z.string()
    .regex(/^0x[a-fA-F0-9]{64}$/, 'Private key must be 32-byte hex string with 0x prefix')
    .optional() // optional vì sẽ chuyển sang signed tx
});

/**
 * Schema cho /api/login endpoint
 */
const loginSchema = z.object({
  address: z.string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
  cccdData: cccdDataSchema,
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
