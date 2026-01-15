const defaultConfig = require('./default');

module.exports = {
  ...defaultConfig,

  server: {
    ...defaultConfig.server,
    port: process.env.PORT || 8080
  },

  parser: {
    ...defaultConfig.parser,
    timeout: 60000,
    maxRetries: 5,
    strictMode: true
  },

  cache: {
    ...defaultConfig.cache,
    ttl: 7200, // 2小时
    maxSize: 500
  },

  rateLimit: {
    ...defaultConfig.rateLimit,
    max: 200
  },

  logging: {
    ...defaultConfig.logging,
    level: 'warn',
    file: {
      enabled: true,
      path: './logs'
    }
  },

  auth: {
    ...defaultConfig.auth,
    enabled: true,
    apiKey: process.env.API_KEY
  }
};

