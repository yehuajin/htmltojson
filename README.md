# Iceblue HTML转结构化JSON解析器

一个完整的冰蓝HTML转结构化JSON的解决方案，支持前端和后端解析。

## 功能特性

- 🚀 **前端解析**: 浏览器端HTML解析，支持DOM遍历和格式化
- 🔧 **后端解析**: 服务器端HTML解析，支持代理和图片处理
- 💾 **缓存管理**: 智能缓存系统，提升解析性能
- 📊 **进度监控**: 实时解析进度跟踪
- 🛡️ **限流保护**: 内置限流器，防止API滥用
- 🔍 **数据验证**: 完整的数据验证机制
- 📝 **日志记录**: 详细的日志记录功能

## 项目结构

```
iceblue-parser/
├── src/
│   ├── frontend/          # 前端解析模块
│   ├── backend/           # 后端服务模块
│   └── shared/            # 共享模块
├── config/                # 配置文件
└── tests/                 # 测试文件
```

## 安装

```bash
npm install
```

## 使用

### 启动后端服务

```bash
npm install
npm start
```

开发模式（自动重启）：

```bash
npm run dev
```

### 前端使用（浏览器/Node.js）

```javascript
const IceblueParser = require('./src/frontend');

const parser = new IceblueParser({
  parser: {
    includeImages: true,
    includeScripts: false,
    strictMode: false
  },
  cache: {
    enabled: true,
    ttl: 3600000 // 1小时
  }
});

// 解析HTML
const result = await parser.parse(htmlContent);
console.log(result);

// 格式化输出
const json = parser.parser.format(result.data, 'json');
const text = parser.parser.format(result.data, 'text');
const html = parser.parser.format(result.data, 'html');
```

### 后端使用（Node.js）

```javascript
const BackendParser = require('./src/backend/parser/BackendParser');

const parser = new BackendParser({
  includeImages: true,
  processImages: false,
  validate: true
});

// 解析HTML字符串
const result = await parser.parse(htmlContent);

// 从URL解析
const urlResult = await parser.parseUrl('https://example.com');

// 批量解析
const results = await parser.parseBatch([html1, html2, html3]);
```

### API端点

#### POST /api/parse
解析HTML内容

**请求体:**
```json
{
  "html": "<html>...</html>",
  "options": {
    "includeImages": true,
    "includeScripts": false,
    "strictMode": false
  }
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "metadata": { ... },
    "structure": { ... },
    "images": [ ... ],
    "links": [ ... ],
    "stats": { ... }
  },
  "duration": 123
}
```

#### POST /api/parse-url
从URL解析HTML

**请求体:**
```json
{
  "url": "https://example.com",
  "options": { ... }
}
```

#### POST /api/parse-batch
批量解析HTML

**请求体:**
```json
{
  "htmls": ["<html>...</html>", "<html>...</html>"],
  "options": { ... }
}
```

#### GET /api/proxy?url=<url>
代理HTTP请求

#### GET /api/stats
获取服务器统计信息

#### GET /health
健康检查端点

## 配置

配置文件位于 `config/` 目录：

- `default.js` - 默认配置
- `production.js` - 生产环境配置

## 测试

```bash
npm test
npm run test:unit
npm run test:integration
```

## 许可证

MIT

