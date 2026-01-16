/**
 * Express服务器
 * 提供HTML解析API服务
 */

// 加载 polyfills（必须在其他模块之前）
require('./polyfills');

const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('../../config/default');
const BackendParser = require('./parser/BackendParser');
const ProxyService = require('./proxy/ProxyService');
const RateLimiter = require('./proxy/RateLimiter');
const AuthMiddleware = require('./middleware/AuthMiddleware');
const LoggingMiddleware = require('./middleware/LoggingMiddleware');

// 初始化应用
const app = express();

// 加载配置（根据环境）
const env = process.env.NODE_ENV || 'development';
const appConfig = env === 'production' 
  ? require('../../config/production')
  : config;

// 初始化组件
const parser = new BackendParser(appConfig.parser);
const proxyService = new ProxyService(appConfig.proxy);
const rateLimiter = new RateLimiter(appConfig.rateLimit);
const authMiddleware = new AuthMiddleware(appConfig.auth);
const loggingMiddleware = new LoggingMiddleware(appConfig.logging);

// 中间件
app.use(cors(appConfig.server.cors));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务（前端页面）
app.use(express.static(path.join(__dirname, '../../public')));

// 日志中间件
app.use(loggingMiddleware.requestLogger());
app.use(loggingMiddleware.errorLogger());

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API路由
const apiRouter = express.Router();

// 限流中间件
apiRouter.use(rateLimiter.middleware());

// 认证中间件（可选）
if (appConfig.auth.enabled) {
  apiRouter.use(authMiddleware.middleware());
}

/**
 * POST /api/parse
 * 解析HTML内容
 */
apiRouter.post('/parse', async (req, res) => {
  try {
    const { html, options } = req.body;

    if (!html) {
      return res.status(400).json({
        success: false,
        error: 'Missing HTML content',
        errorCode: 'INVALID_INPUT'
      });
    }

    const parseOptions = options || {};
    const result = await parser.parse(html, parseOptions);

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    loggingMiddleware.error('Parse error', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      error: error.message,
      errorCode: 'INTERNAL_ERROR'
    });
  }
});

/**
 * POST /api/parse-url
 * 从URL解析HTML
 */
apiRouter.post('/parse-url', async (req, res) => {
  try {
    const { url, options } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'Missing URL',
        errorCode: 'INVALID_INPUT'
      });
    }

    const parseOptions = options || {};
    const result = await parser.parseUrl(url, parseOptions);

    if (result.success) {
      res.json(result);
    } else {
      // 根据错误类型返回相应的HTTP状态码
      let statusCode = 500;
      if (result.errorCode === 'NETWORK_ERROR') {
        statusCode = 502; // Bad Gateway
      } else if (result.errorCode === 'HTTP_ERROR') {
        // 如果获取到了HTTP状态码，使用它；否则使用502
        statusCode = result.details?.status || 502;
      } else if (result.errorCode === 'INVALID_INPUT') {
        statusCode = 400;
      }
      
      // 记录详细的错误日志
      loggingMiddleware.error('Parse URL failed', {
        url: url,
        error: result.error,
        errorCode: result.errorCode,
        details: result.details
      });
      
      res.status(statusCode).json(result);
    }
  } catch (error) {
    loggingMiddleware.error('Parse URL error', { 
      error: error.message, 
      stack: error.stack,
      url: req.body.url 
    });
    res.status(500).json({
      success: false,
      error: error.message,
      errorCode: 'INTERNAL_ERROR'
    });
  }
});

/**
 * GET /api/proxy
 * 代理请求
 */
apiRouter.get('/proxy', async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'Missing URL parameter',
        errorCode: 'INVALID_INPUT'
      });
    }

    const result = await proxyService.fetch(url, {
      responseType: req.query.responseType || 'text'
    });

    if (result.success) {
      res.set(result.headers);
      res.send(result.data);
    } else {
      const statusCode = result.status || 500;
      res.status(statusCode).json({
        success: false,
        error: result.error,
        errorCode: result.code || 'PROXY_ERROR'
      });
    }
  } catch (error) {
    loggingMiddleware.error('Proxy error', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      error: error.message,
      errorCode: 'INTERNAL_ERROR'
    });
  }
});

/**
 * POST /api/parse-batch
 * 批量解析HTML
 */
apiRouter.post('/parse-batch', async (req, res) => {
  try {
    const { htmls, options } = req.body;

    if (!htmls || !Array.isArray(htmls)) {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid HTML array',
        errorCode: 'INVALID_INPUT'
      });
    }

    if (htmls.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'Batch size exceeds maximum of 100',
        errorCode: 'INVALID_INPUT'
      });
    }

    const parseOptions = options || {};
    const results = await parser.parseBatch(htmls, parseOptions);

    res.json({
      success: true,
      results,
      total: results.length,
      successful: results.filter(r => r.success).length
    });
  } catch (error) {
    loggingMiddleware.error('Batch parse error', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      error: error.message,
      errorCode: 'INTERNAL_ERROR'
    });
  }
});

/**
 * GET /api/stats
 * 获取统计信息
 */
apiRouter.get('/stats', (req, res) => {
  res.json({
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

// 挂载API路由
app.use('/api', apiRouter);

// 404处理 - API请求返回JSON，其他请求返回前端页面
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({
      success: false,
      error: 'Not Found',
      errorCode: 'NOT_FOUND'
    });
  }
  // 非API请求返回前端页面
  res.sendFile(path.join(__dirname, '../../public/index.html'));
});

// 错误处理中间件
app.use((err, req, res, next) => {
  loggingMiddleware.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method
  });

  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
    errorCode: 'INTERNAL_ERROR'
  });
});

// 启动服务器
const PORT = appConfig.server.port;
const HOST = appConfig.server.host;

const server = app.listen(PORT, HOST, () => {
  loggingMiddleware.info('Server started', {
    host: HOST,
    port: PORT,
    env: env
  });
  
  console.log(`🚀 Server running at http://${HOST}:${PORT}`);
  console.log(`📊 Health check: http://${HOST}:${PORT}/health`);
  console.log(`🔍 API endpoint: http://${HOST}:${PORT}/api/parse`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  loggingMiddleware.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    loggingMiddleware.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  loggingMiddleware.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    loggingMiddleware.info('Server closed');
    process.exit(0);
  });
});

module.exports = app;

