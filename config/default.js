module.exports = {
  // 服务器配置
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost',
    cors: {
      origin: '*',
      credentials: true
    }
  },

  // 解析器配置
  parser: {
    timeout: 30000,
    maxRetries: 3,
    strictMode: false,
    includeImages: true,
    includeScripts: false,
    includeStyles: false
  },

  // 缓存配置
  cache: {
    enabled: true,
    ttl: 3600, // 1小时
    maxSize: 100 // 最大缓存条目数
  },

  // 限流配置
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 100, // 每个窗口最多100个请求
    message: 'Too many requests from this IP, please try again later.'
  },

  // 代理配置
  proxy: {
    enabled: true,
    timeout: 10000,
    retries: 2,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  },

  // 日志配置
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: 'json',
    file: {
      enabled: true,
      path: './logs'
    }
  },

  // 认证配置
  auth: {
    enabled: false,
    apiKey: process.env.API_KEY || ''
  }
};

