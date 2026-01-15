/**
 * 日志中间件
 * 用于记录请求日志
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');

class LoggingMiddleware {
  constructor(options = {}) {
    this.options = {
      level: options.level || 'info',
      format: options.format || 'json',
      file: options.file || {},
      console: options.console !== false,
      ...options
    };

    // 确保日志目录存在
    if (this.options.file.enabled && this.options.file.path) {
      const logDir = path.dirname(this.options.file.path);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
    }

    // 创建Winston logger
    this.logger = this.createLogger();
  }

  /**
   * 创建Logger实例
   * @returns {winston.Logger} Logger实例
   */
  createLogger() {
    const transports = [];

    // 控制台输出
    if (this.options.console) {
      transports.push(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, ...meta }) => {
              let msg = `${timestamp} [${level}]: ${message}`;
              if (Object.keys(meta).length > 0) {
                msg += ` ${JSON.stringify(meta)}`;
              }
              return msg;
            })
          )
        })
      );
    }

    // 文件输出
    if (this.options.file.enabled) {
      const fileFormat = this.options.format === 'json'
        ? winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          )
        : winston.format.combine(
            winston.format.timestamp(),
            winston.format.printf(({ timestamp, level, message, ...meta }) => {
              let msg = `${timestamp} [${level}]: ${message}`;
              if (Object.keys(meta).length > 0) {
                msg += ` ${JSON.stringify(meta)}`;
              }
              return msg;
            })
          );

      // 通用日志文件
      if (this.options.file.path) {
        transports.push(
          new winston.transports.File({
            filename: this.options.file.path,
            format: fileFormat,
            maxsize: this.options.file.maxSize || 10485760, // 10MB
            maxFiles: this.options.file.maxFiles || 5
          })
        );
      }

      // 错误日志文件
      if (this.options.file.errorPath) {
        transports.push(
          new winston.transports.File({
            filename: this.options.file.errorPath,
            level: 'error',
            format: fileFormat,
            maxsize: this.options.file.maxSize || 10485760,
            maxFiles: this.options.file.maxFiles || 5
          })
        );
      }
    }

    return winston.createLogger({
      level: this.options.level,
      transports,
      exitOnError: false
    });
  }

  /**
   * Express请求日志中间件
   * @returns {Function} Express中间件函数
   */
  requestLogger() {
    return (req, res, next) => {
      const startTime = Date.now();

      // 记录请求开始
      this.logger.info('Incoming request', {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        headers: this.sanitizeHeaders(req.headers)
      });

      // 监听响应完成
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        const logData = {
          method: req.method,
          url: req.url,
          status: res.statusCode,
          duration,
          ip: req.ip,
          userAgent: req.get('user-agent')
        };

        if (res.statusCode >= 400) {
          this.logger.error('Request failed', logData);
        } else {
          this.logger.info('Request completed', logData);
        }
      });

      next();
    };
  }

  /**
   * 错误日志中间件
   * @returns {Function} Express中间件函数
   */
  errorLogger() {
    return (err, req, res, next) => {
      this.logger.error('Request error', {
        error: {
          message: err.message,
          stack: err.stack,
          name: err.name
        },
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('user-agent')
      });

      next(err);
    };
  }

  /**
   * 清理敏感头部信息
   * @param {Object} headers - 请求头对象
   * @returns {Object} 清理后的头部对象
   */
  sanitizeHeaders(headers) {
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
    const sanitized = { ...headers };

    for (const key of sensitiveHeaders) {
      if (sanitized[key]) {
        sanitized[key] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * 记录信息日志
   * @param {string} message - 日志消息
   * @param {Object} meta - 元数据
   */
  info(message, meta = {}) {
    this.logger.info(message, meta);
  }

  /**
   * 记录错误日志
   * @param {string} message - 日志消息
   * @param {Object} meta - 元数据
   */
  error(message, meta = {}) {
    this.logger.error(message, meta);
  }

  /**
   * 记录警告日志
   * @param {string} message - 日志消息
   * @param {Object} meta - 元数据
   */
  warn(message, meta = {}) {
    this.logger.warn(message, meta);
  }

  /**
   * 记录调试日志
   * @param {string} message - 日志消息
   * @param {Object} meta - 元数据
   */
  debug(message, meta = {}) {
    this.logger.debug(message, meta);
  }

  /**
   * 获取Logger实例
   * @returns {winston.Logger} Logger实例
   */
  getLogger() {
    return this.logger;
  }
}

module.exports = LoggingMiddleware;

