/**
 * 前端主入口文件
 * 导出所有解析器和工具类
 */

const IceblueHtmlParser = require('./parser/IceblueHtmlParser');
const DomTraverser = require('./parser/DomTraverser');
const IceblueSpecificParser = require('./parser/IceblueSpecificParser');
const Formatter = require('./parser/Formatter');
const CacheManager = require('./utils/CacheManager');
const ProgressMonitor = require('./utils/ProgressMonitor');
const UrlUtils = require('./utils/UrlUtils');

/**
 * 冰蓝解析器主类（带缓存）
 */
class IceblueParser {
  constructor(options = {}) {
    this.parser = new IceblueHtmlParser(options.parser || {});
    this.cache = new CacheManager(options.cache || {});
    this.defaultOptions = options || {};
  }

  /**
   * 解析HTML
   * @param {string} html - HTML字符串
   * @param {Object} options - 解析选项
   * @returns {Promise<Object>} 解析结果
   */
  async parse(html, options = {}) {
    const parseOptions = { ...this.defaultOptions, ...options };
    
    // 生成缓存键
    const cacheKey = this.cache.generateKey(html, parseOptions);
    
    // 尝试从缓存获取
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return {
        ...cached,
        cached: true
      };
    }

    // 解析HTML
    const result = await this.parser.parse(html, parseOptions);
    
    // 缓存结果
    if (result.success) {
      this.cache.set(cacheKey, result);
    }
    
    return result;
  }

  /**
   * 解析并格式化输出
   * @param {string} html - HTML字符串
   * @param {string} format - 输出格式 (json, text, html, xml)
   * @param {Object} options - 解析选项
   * @returns {Promise<string>} 格式化后的字符串
   */
  async parseAndFormat(html, format = 'json', options = {}) {
    const result = await this.parse(html, options);
    
    if (!result.success) {
      throw new Error(result.error || 'Parse failed');
    }
    
    return this.parser.format(result.data, format, options);
  }

  /**
   * 解析URL
   * @param {string} url - URL字符串
   * @param {Object} options - 解析选项
   * @returns {Promise<Object>} 解析结果
   */
  async parseUrl(url, options = {}) {
    try {
      // 浏览器环境使用fetch，Node.js环境需要使用代理服务
      if (typeof fetch !== 'undefined') {
        // 浏览器环境
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const html = await response.text();
        
        // 解析HTML
        return await this.parse(html, {
          ...options,
          url
        });
      } else {
        // Node.js环境，应该使用后端API或ProxyService
        throw new Error('parseUrl requires fetch API in browser or backend proxy service in Node.js');
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        errorCode: 'NETWORK_ERROR'
      };
    }
  }

  /**
   * 获取缓存统计
   * @returns {Object} 缓存统计信息
   */
  getCacheStats() {
    return this.cache.getStats();
  }

  /**
   * 清空缓存
   */
  clearCache() {
    this.cache.clear();
  }
}

// 导出所有模块
module.exports = {
  // 主类
  default: IceblueParser,
  IceblueParser,
  
  // 解析器
  IceblueHtmlParser,
  DomTraverser,
  IceblueSpecificParser,
  Formatter,
  
  // 工具类
  CacheManager,
  ProgressMonitor,
  UrlUtils
};

