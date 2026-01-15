/**
 * 认证中间件
 * 用于API认证
 */

const config = require('../../../config/default');

class AuthMiddleware {
  constructor(options = {}) {
    this.options = {
      enabled: options.enabled !== undefined ? options.enabled : config.auth.enabled,
      apiKey: options.apiKey || config.auth.apiKey,
      headerName: options.headerName || 'X-API-Key',
      ...options
    };
  }

  /**
   * 验证API密钥
   * @param {string} apiKey - API密钥
   * @returns {boolean} 是否有效
   */
  validateApiKey(apiKey) {
    if (!this.options.enabled) {
      return true; // 如果未启用认证，则允许所有请求
    }

    if (!this.options.apiKey) {
      return false; // 如果未配置API密钥，则拒绝所有请求
    }

    return apiKey === this.options.apiKey;
  }

  /**
   * 从请求中提取API密钥
   * @param {Request} req - Express请求对象
   * @returns {string|null} API密钥
   */
  extractApiKey(req) {
    // 从请求头中提取
    const headerKey = req.headers[this.options.headerName.toLowerCase()];
    if (headerKey) {
      return headerKey;
    }

    // 从查询参数中提取
    const queryKey = req.query.apiKey || req.query.key;
    if (queryKey) {
      return queryKey;
    }

    // 从请求体中提取
    if (req.body && req.body.apiKey) {
      return req.body.apiKey;
    }

    return null;
  }

  /**
   * Express中间件
   * @returns {Function} Express中间件函数
   */
  middleware() {
    return (req, res, next) => {
      // 如果未启用认证，直接通过
      if (!this.options.enabled) {
        return next();
      }

      // 提取API密钥
      const apiKey = this.extractApiKey(req);

      // 验证API密钥
      if (!apiKey || !this.validateApiKey(apiKey)) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid or missing API key'
        });
      }

      // 认证通过，继续处理请求
      next();
    };
  }

  /**
   * 可选认证中间件（认证失败不阻止请求）
   * @returns {Function} Express中间件函数
   */
  optionalMiddleware() {
    return (req, res, next) => {
      const apiKey = this.extractApiKey(req);
      
      if (apiKey && this.validateApiKey(apiKey)) {
        req.authenticated = true;
      } else {
        req.authenticated = false;
      }

      next();
    };
  }

  /**
   * 生成API密钥（简单示例，实际应用中应使用更安全的方法）
   * @returns {string} API密钥
   */
  generateApiKey() {
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex');
  }
}

module.exports = AuthMiddleware;

