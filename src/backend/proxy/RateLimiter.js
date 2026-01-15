/**
 * 限流器
 * 用于限制API请求频率
 */

const { RateLimiterMemory, RateLimiterRedis } = require('rate-limiter-flexible');

class RateLimiter {
  constructor(options = {}) {
    this.options = {
      points: options.points || 100, // 每个时间段允许的请求数
      duration: options.duration || 60, // 时间段（秒）
      blockDuration: options.blockDuration || 0, // 超出限制后的阻塞时间（秒）
      useRedis: options.useRedis || false,
      redisClient: options.redisClient || null,
      ...options
    };

    // 初始化限流器
    if (this.options.useRedis && this.options.redisClient) {
      this.limiter = new RateLimiterRedis({
        storeClient: this.options.redisClient,
        points: this.options.points,
        duration: this.options.duration,
        blockDuration: this.options.blockDuration
      });
    } else {
      this.limiter = new RateLimiterMemory({
        points: this.options.points,
        duration: this.options.duration,
        blockDuration: this.options.blockDuration
      });
    }
  }

  /**
   * 检查是否允许请求
   * @param {string} key - 限流键（通常是IP地址或用户ID）
   * @returns {Promise<Object>} 限流结果
   */
  async check(key) {
    try {
      await this.limiter.consume(key);
      return {
        allowed: true,
        remaining: await this.getRemaining(key),
        resetTime: await this.getResetTime(key)
      };
    } catch (rateLimiterRes) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: rateLimiterRes.msBeforeNext || 0,
        error: 'Rate limit exceeded'
      };
    }
  }

  /**
   * 获取剩余请求数
   * @param {string} key - 限流键
   * @returns {Promise<number>} 剩余请求数
   */
  async getRemaining(key) {
    try {
      const rateLimiterRes = await this.limiter.get(key);
      return rateLimiterRes ? rateLimiterRes.remainingPoints : this.options.points;
    } catch (error) {
      return this.options.points;
    }
  }

  /**
   * 获取重置时间
   * @param {string} key - 限流键
   * @returns {Promise<number>} 重置时间（毫秒）
   */
  async getResetTime(key) {
    try {
      const rateLimiterRes = await this.limiter.get(key);
      return rateLimiterRes ? rateLimiterRes.msBeforeNext : 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * 删除限流记录
   * @param {string} key - 限流键
   * @returns {Promise<boolean>} 是否成功删除
   */
  async delete(key) {
    try {
      await this.limiter.delete(key);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Express中间件
   * @returns {Function} Express中间件函数
   */
  middleware() {
    return async (req, res, next) => {
      const key = this.getKey(req);
      const result = await this.check(key);

      // 设置响应头
      res.setHeader('X-RateLimit-Limit', this.options.points);
      res.setHeader('X-RateLimit-Remaining', result.remaining);
      res.setHeader('X-RateLimit-Reset', new Date(Date.now() + result.resetTime).toISOString());

      if (!result.allowed) {
        return res.status(429).json({
          error: 'Too many requests',
          message: result.error,
          retryAfter: Math.ceil(result.resetTime / 1000)
        });
      }

      next();
    };
  }

  /**
   * 获取限流键
   * @param {Request} req - Express请求对象
   * @returns {string} 限流键
   */
  getKey(req) {
    // 优先使用IP地址
    return req.ip || req.connection.remoteAddress || 'unknown';
  }

  /**
   * 重置限流器
   */
  async reset() {
    // 内存限流器会在时间窗口后自动重置
    // Redis限流器需要手动清除或等待过期
    if (this.limiter && typeof this.limiter.reset === 'function') {
      await this.limiter.reset();
    }
  }
}

module.exports = RateLimiter;

