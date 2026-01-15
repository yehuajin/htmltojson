/**
 * 冰蓝解析器常量定义
 */

module.exports = {
  // HTML标签分类
  TAG_CATEGORIES: {
    STRUCTURAL: ['html', 'head', 'body', 'div', 'section', 'article', 'aside', 'nav', 'header', 'footer', 'main'],
    TEXT: ['p', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'em', 'strong', 'i', 'b', 'u', 'small', 'mark', 'del', 'ins'],
    LIST: ['ul', 'ol', 'li', 'dl', 'dt', 'dd'],
    TABLE: ['table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td'],
    FORM: ['form', 'input', 'textarea', 'select', 'option', 'button', 'label'],
    MEDIA: ['img', 'video', 'audio', 'iframe', 'embed', 'object'],
    LINK: ['a', 'link'],
    META: ['meta', 'title', 'script', 'style']
  },

  // 冰蓝特定的CSS选择器
  ICEBLUE_SELECTORS: {
    CONTENT_WRAPPER: '.iceblue-content, .content-wrapper, [class*="content"]',
    NAVIGATION: '.nav, .navigation, nav, [role="navigation"]',
    HEADER: 'header, .header, [role="banner"]',
    FOOTER: 'footer, .footer, [role="contentinfo"]',
    MAIN_CONTENT: 'main, .main, [role="main"]',
    SIDEBAR: '.sidebar, aside, [role="complementary"]',
    ARTICLE: 'article, .article, [role="article"]'
  },

  // 解析选项
  PARSER_OPTIONS: {
    INCLUDE_IMAGES: 'includeImages',
    INCLUDE_SCRIPTS: 'includeScripts',
    INCLUDE_STYLES: 'includeStyles',
    STRICT_MODE: 'strictMode',
    DEPTH_LIMIT: 'depthLimit',
    TEXT_ONLY: 'textOnly'
  },

  // 错误代码
  ERROR_CODES: {
    PARSE_FAILED: 'PARSE_FAILED',
    INVALID_HTML: 'INVALID_HTML',
    TIMEOUT: 'TIMEOUT',
    NETWORK_ERROR: 'NETWORK_ERROR',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    AUTH_FAILED: 'AUTH_FAILED',
    VALIDATION_ERROR: 'VALIDATION_ERROR'
  },

  // 默认值
  DEFAULTS: {
    MAX_DEPTH: 100,
    MAX_TEXT_LENGTH: 10000,
    IMAGE_TIMEOUT: 5000,
    CACHE_TTL: 3600
  },

  // 支持的MIME类型
  MIME_TYPES: {
    HTML: 'text/html',
    JSON: 'application/json',
    XML: 'application/xml',
    TEXT: 'text/plain'
  }
};

