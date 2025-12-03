const winston = require('winston');
const path = require('path');

// Định nghĩa định dạng log:
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

    // Định nghĩa định dạng log cho console
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

// Tạo logger với các transports
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'did-backend' },
  transports: [
    // Viết tất cả log ra console
    new winston.transports.Console({
      format: consoleFormat
    }),

    // Viết tất cả log với level 'error' ra error.log
    new winston.transports.File({ 
      filename: path.join(__dirname, '../../logs/error.log'), 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),

    // Viết tất cả log ra combined.log
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ],
  
  // Xử lý ngoại lệ
  exceptionHandlers: [
    new winston.transports.File({ 
      filename: path.join(__dirname, '../../logs/exceptions.log') 
    })
  ],

  // Xử lý từ chối
  rejectionHandlers: [
    new winston.transports.File({ 
      filename: path.join(__dirname, '../../logs/rejections.log') 
    })
  ]
});

// Tạo một đối tượng stream cho tích hợp Morgan
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

module.exports = logger;
