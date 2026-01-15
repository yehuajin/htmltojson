/**
 * URL工具类
 * 用于处理URL相关操作
 */

class UrlUtils {
  /**
   * 解析URL
   * @param {string} url - URL字符串
   * @returns {Object|null} URL对象
   */
  static parse(url) {
    if (!url || typeof url !== 'string') {
      return null;
    }

    try {
      // 浏览器环境
      if (typeof window !== 'undefined' && window.URL) {
        return new URL(url);
      }
      
      // Node.js环境
      const { URL } = require('url');
      return new URL(url);
    } catch (error) {
      return null;
    }
  }

  /**
   * 规范化URL
   * @param {string} url - URL字符串
   * @param {string} base - 基础URL
   * @returns {string} 规范化后的URL
   */
  static normalize(url, base = null) {
    if (!url) {
      return '';
    }

    try {
      // 如果URL已经是绝对URL
      if (this.isAbsolute(url)) {
        return url;
      }

      // 如果有基础URL，则合并
      if (base) {
        const baseUrl = this.parse(base);
        if (baseUrl) {
          const resolved = new URL(url, baseUrl.href);
          return resolved.href;
        }
      }

      return url;
    } catch (error) {
      return url;
    }
  }

  /**
   * 检查是否为绝对URL
   * @param {string} url - URL字符串
   * @returns {boolean} 是否为绝对URL
   */
  static isAbsolute(url) {
    if (!url || typeof url !== 'string') {
      return false;
    }

    // 检查协议
    return /^[a-z][a-z\d+\-.]*:/i.test(url) || url.startsWith('//');
  }

  /**
   * 获取域名
   * @param {string} url - URL字符串
   * @returns {string} 域名
   */
  static getDomain(url) {
    const parsed = this.parse(url);
    return parsed ? parsed.hostname : '';
  }

  /**
   * 获取协议
   * @param {string} url - URL字符串
   * @returns {string} 协议
   */
  static getProtocol(url) {
    const parsed = this.parse(url);
    return parsed ? parsed.protocol.replace(':', '') : '';
  }

  /**
   * 获取路径
   * @param {string} url - URL字符串
   * @returns {string} 路径
   */
  static getPath(url) {
    const parsed = this.parse(url);
    return parsed ? parsed.pathname : '';
  }

  /**
   * 获取查询参数
   * @param {string} url - URL字符串
   * @returns {Object} 查询参数对象
   */
  static getQueryParams(url) {
    const parsed = this.parse(url);
    if (!parsed || !parsed.search) {
      return {};
    }

    const params = {};
    const searchParams = parsed.searchParams || new URLSearchParams(parsed.search);
    
    for (const [key, value] of searchParams.entries()) {
      params[key] = value;
    }

    return params;
  }

  /**
   * 构建查询字符串
   * @param {Object} params - 参数对象
   * @returns {string} 查询字符串
   */
  static buildQueryString(params) {
    if (!params || typeof params !== 'object') {
      return '';
    }

    const searchParams = new URLSearchParams();
    
    for (const [key, value] of Object.entries(params)) {
      if (value !== null && value !== undefined) {
        searchParams.append(key, String(value));
      }
    }

    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
  }

  /**
   * 合并URL和路径
   * @param {string} base - 基础URL
   * @param {string} path - 路径
   * @returns {string} 合并后的URL
   */
  static join(base, path) {
    if (!base) {
      return path || '';
    }

    if (!path) {
      return base;
    }

    // 规范化base URL
    const baseUrl = this.parse(base);
    if (!baseUrl) {
      return `${base}/${path}`.replace(/\/+/g, '/');
    }

    // 移除路径末尾的斜杠
    const basePath = baseUrl.pathname.replace(/\/$/, '');
    
    // 确保路径以斜杠开头
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    
    baseUrl.pathname = basePath + normalizedPath;
    
    return baseUrl.href;
  }

  /**
   * 提取文件扩展名
   * @param {string} url - URL字符串
   * @returns {string} 扩展名
   */
  static getExtension(url) {
    const path = this.getPath(url);
    const match = path.match(/\.([a-z0-9]+)$/i);
    return match ? match[1].toLowerCase() : '';
  }

  /**
   * 检查是否为图片URL
   * @param {string} url - URL字符串
   * @returns {boolean} 是否为图片URL
   */
  static isImageUrl(url) {
    const extension = this.getExtension(url);
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'];
    return imageExtensions.includes(extension);
  }

  /**
   * 转换为data URL
   * @param {string} url - URL字符串
   * @returns {Promise<string>} Data URL
   */
  static async toDataUrl(url) {
    // 这是一个占位符，实际实现需要根据环境进行
    // 浏览器环境可以使用fetch + canvas
    // Node.js环境需要下载图片并转换为base64
    return url;
  }

  /**
   * 清理URL（移除查询参数和锚点）
   * @param {string} url - URL字符串
   * @returns {string} 清理后的URL
   */
  static clean(url) {
    const parsed = this.parse(url);
    if (!parsed) {
      return url;
    }

    return `${parsed.protocol}//${parsed.host}${parsed.pathname}`;
  }

  /**
   * 检查URL是否有效
   * @param {string} url - URL字符串
   * @returns {boolean} 是否有效
   */
  static isValid(url) {
    return this.parse(url) !== null;
  }

  /**
   * 相对路径转绝对路径
   * @param {string} relativePath - 相对路径
   * @param {string} baseUrl - 基础URL
   * @returns {string} 绝对路径
   */
  static toAbsolute(relativePath, baseUrl) {
    return this.normalize(relativePath, baseUrl);
  }
}

module.exports = UrlUtils;

