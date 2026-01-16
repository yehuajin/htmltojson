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

## 系统要求

- **Node.js**: >= 18.0.0（推荐 18.17.0+ 或 20+）
- **npm**: >= 8.0.0

## 安装

```bash
npm install
```

**注意**: 
- 项目已内置 polyfill 支持 Node.js 18.0.0+，如果遇到 `File is not defined` 错误，polyfill 会自动处理
- 推荐使用 Node.js 18.17.0+ 或 20+ 以获得最佳兼容性
- 如果遇到依赖问题，请重新安装：`rm -rf node_modules package-lock.json && npm install`

### 可选依赖

**图片处理功能（sharp）**

`sharp` 是一个可选依赖，用于图片优化和处理。如果安装失败（通常是网络问题），项目仍可正常使用，但图片优化功能将不可用。

如果需要图片处理功能，可以单独安装：

```bash
npm install sharp
```

或者使用国内镜像：

```bash
npm install sharp --registry=https://registry.npmmirror.com
```

**注意**: 如果不需要图片处理功能，可以忽略 sharp 的安装错误，项目其他功能不受影响。

## 使用

### 启动服务

```bash
npm install
npm start
```

开发模式（自动重启）：

```bash
npm run dev
```

服务启动后，访问 `http://localhost:3000` 打开前端页面。

### 前端页面

项目包含一个完整的前端Web界面，提供以下功能：

- 📝 **HTML内容解析**: 直接粘贴HTML代码进行解析
- 🌐 **URL解析**: 输入网页URL自动获取并解析
- ⚙️ **解析选项**: 可配置包含图片、脚本、样式等选项
- 📊 **多格式展示**: 支持JSON、文本、HTML、XML格式输出
- 📈 **统计信息**: 显示元素数量、文本长度、解析耗时等
- 💾 **结果导出**: 支持复制和下载解析结果
- 🎨 **美观界面**: 现代化的响应式设计

访问 `http://localhost:3000` 即可使用。

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

