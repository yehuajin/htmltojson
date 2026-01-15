/**
 * 缓存管理器
 * 用于缓存解析结果，提升性能
 */

class CacheManager {
  constructor(options = {}) {
    this.cache = new Map();
    this.maxSize = options.maxSize || 100;
    this.defaultTTL = options.ttl || 3600000; // 默认1小时
    this.enabled = options.enabled !== false;
  }

  /**
   * 生成缓存键
   * @param {string} html - HTML内容
   * @param {Object} options - 解析选项
   * @returns {string} 缓存键
   */
  generateKey(html, options = {}) {
    const crypto = typeof window !== 'undefined' && window.crypto
      ? window.crypto
      : require('crypto');

    const content = JSON.stringify({ html, options });
    
    if (typeof crypto.subtle !== 'undefined') {
      // 浏览器环境 - 使用简单哈希
      return this.simpleHash(content);
    } else {
      // Node.js环境
      return crypto.createHash('md5').update(content).digest('hex');
    }
  }

  /**
   * 简单哈希函数（用于浏览器环境）
   * @param {string} str - 字符串
   * @returns {string} 哈希值
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return hash.toString(36);
  }

  /**
   * 获取缓存
   * @param {string} key - 缓存键
   * @returns {Object|null} 缓存数据
   */
  get(key) {
    if (!this.enabled) {
      return null;
    }

    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // 检查是否过期
    if (item.expires && Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }

    // 更新访问时间
    item.lastAccessed = Date.now();
    
    return item.data;
  }

  /**
   * 设置缓存
   * @param {string} key - 缓存键
   * @param {Object} data - 数据
   * @param {number} ttl - 过期时间（毫秒）
   */
  set(key, data, ttl = null) {
    if (!this.enabled) {
      return;
    }

    // 检查缓存大小
    if (this.cache.size >= this.maxSize) {
      this.evict();
    }

    const ttlValue = ttl !== null ? ttl : this.defaultTTL;
    const item = {
      data,
      createdAt: Date.now(),
      lastAccessed: Date.now(),
      expires: ttlValue > 0 ? Date.now() + ttlValue : null
    };

    this.cache.set(key, item);
  }

  /**
   * 删除缓存
   * @param {string} key - 缓存键
   * @returns {boolean} 是否成功删除
   */
  delete(key) {
    return this.cache.delete(key);
  }

  /**
   * 清空所有缓存
   */
  clear() {
    this.cache.clear();
  }

  /**
   * 淘汰缓存项（LRU策略）
   */
  evict() {
    if (this.cache.size === 0) {
      return;
    }

    // 找到最少使用的项
    let leastUsedKey = null;
    let leastUsedTime = Infinity;

    for (const [key, item] of this.cache.entries()) {
      // 优先淘汰过期项
      if (item.expires && Date.now() > item.expires) {
        this.cache.delete(key);
        return;
      }

      // 找到最少使用的项
      if (item.lastAccessed < leastUsedTime) {
        leastUsedTime = item.lastAccessed;
        leastUsedKey = key;
      }
    }

    if (leastUsedKey) {
      this.cache.delete(leastUsedKey);
    }
  }

  /**
   * 清理过期缓存
   * @returns {number} 清理的数量
   */
  cleanup() {
    let cleaned = 0;
    const now = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (item.expires && now > item.expires) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * 获取缓存统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    const now = Date.now();
    let expired = 0;
    let totalSize = 0;

    for (const item of this.cache.values()) {
      if (item.expires && now > item.expires) {
        expired++;
      }
      totalSize += this.estimateSize(item.data);
    }

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      expired,
      totalSize,
      hitRate: this.calculateHitRate()
    };
  }

  /**
   * 估算数据大小
   * @param {Object} data - 数据对象
   * @returns {number} 估算大小（字节）
   */
  estimateSize(data) {
    const str = JSON.stringify(data);
    if (typeof Blob !== 'undefined') {
      return new Blob([str]).size || str.length * 2;
    }
    // Node.js环境或没有Blob的环境，使用字符串长度估算
    return Buffer ? Buffer.byteLength(str, 'utf8') : str.length * 2;
  }

  /**
   * 计算命中率
   * @returns {number} 命中率
   */
  calculateHitRate() {
    // 需要实现命中率统计逻辑
    // 这里简化处理
    return 0;
  }

  /**
   * 检查缓存是否存在且有效
   * @param {string} key - 缓存键
   * @returns {boolean} 是否存在
   */
  has(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      return false;
    }

    if (item.expires && Date.now() > item.expires) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }
}

module.exports = CacheManager;

