/**
 * 代理服务
 * 用于代理HTTP请求
 */

const axios = require('axios');
const config = require('../../../config/default');

class ProxyService {
  constructor(options = {}) {
    this.options = {
      timeout: options.timeout || config.proxy.timeout,
      retries: options.retries || config.proxy.retries,
      userAgent: options.userAgent || config.proxy.userAgent,
      ...options
    };

    this.axiosInstance = axios.create({
      timeout: this.options.timeout,
      headers: {
        'User-Agent': this.options.userAgent
      }
    });

    // 请求拦截器
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // 可以在这里添加请求日志等
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.axiosInstance.interceptors.response.use(
      (response) => {
        return response;
      },
      async (error) => {
        // 重试逻辑
        const config = error.config;
        
        if (config && config.__retryCount < this.options.retries) {
          config.__retryCount = config.__retryCount || 0;
          config.__retryCount += 1;

          // 等待后重试
          await this.delay(config.__retryCount * 1000);

          return this.axiosInstance(config);
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * 获取URL内容
   * @param {string} url - URL地址
   * @param {Object} options - 请求选项
   * @returns {Promise<Object>} 响应数据
   */
  async fetch(url, options = {}) {
    try {
      const response = await this.axiosInstance.get(url, {
        ...options,
        headers: {
          'User-Agent': this.options.userAgent,
          ...options.headers
        },
        responseType: options.responseType || 'text'
      });

      return {
        success: true,
        data: response.data,
        status: response.status,
        headers: response.headers,
        url: response.request.res.responseUrl || url
      };
    } catch (error) {
      // 更详细的错误信息
      let errorMessage = error.message || 'Unknown error';
      let errorCode = error.code;
      
      // 处理常见的网络错误
      if (error.code === 'ECONNREFUSED') {
        errorMessage = `连接被拒绝: ${url}`;
      } else if (error.code === 'ETIMEDOUT') {
        errorMessage = `请求超时: ${url}`;
      } else if (error.code === 'ENOTFOUND') {
        errorMessage = `无法解析主机名: ${url}`;
      } else if (error.code === 'ECONNRESET') {
        errorMessage = `连接被重置: ${url}`;
      } else if (error.response) {
        // HTTP错误响应
        errorMessage = `HTTP ${error.response.status}: ${error.response.statusText || error.message}`;
      } else if (error.request && !error.response) {
        errorMessage = `无法连接到服务器: ${url}`;
      }
      
      return {
        success: false,
        error: errorMessage,
        status: error.response ? error.response.status : null,
        code: errorCode,
        details: {
          url: url,
          message: error.message,
          code: error.code,
          response: error.response ? {
            status: error.response.status,
            statusText: error.response.statusText,
            headers: error.response.headers
          } : null
        }
      };
    }
  }

  /**
   * 获取HTML内容
   * @param {string} url - URL地址
   * @param {Object} options - 请求选项
   * @returns {Promise<string>} HTML字符串
   */
  async fetchHTML(url, options = {}) {
    const result = await this.fetch(url, {
      ...options,
      responseType: 'text'
    });

    if (!result.success) {
      // 创建一个详细的错误对象
      const error = new Error(result.error || 'Failed to fetch HTML');
      error.details = result.details || {};
      error.status = result.status;
      error.code = result.code;
      throw error;
    }

    return result.data;
  }

  /**
   * 获取JSON内容
   * @param {string} url - URL地址
   * @param {Object} options - 请求选项
   * @returns {Promise<Object>} JSON对象
   */
  async fetchJSON(url, options = {}) {
    const result = await this.fetch(url, {
      ...options,
      responseType: 'json'
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch JSON');
    }

    return result.data;
  }

  /**
   * POST请求
   * @param {string} url - URL地址
   * @param {Object} data - 请求数据
   * @param {Object} options - 请求选项
   * @returns {Promise<Object>} 响应数据
   */
  async post(url, data, options = {}) {
    try {
      const response = await this.axiosInstance.post(url, data, {
        ...options,
        headers: {
          'User-Agent': this.options.userAgent,
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      return {
        success: true,
        data: response.data,
        status: response.status,
        headers: response.headers
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        status: error.response ? error.response.status : null,
        code: error.code
      };
    }
  }

  /**
   * 检查URL是否可访问
   * @param {string} url - URL地址
   * @returns {Promise<boolean>} 是否可访问
   */
  async checkAccessibility(url) {
    try {
      const response = await this.axiosInstance.head(url, {
        timeout: 5000
      });
      return response.status >= 200 && response.status < 400;
    } catch (error) {
      return false;
    }
  }

  /**
   * 获取重定向URL
   * @param {string} url - 原始URL
   * @returns {Promise<string>} 最终URL
   */
  async getRedirectUrl(url) {
    try {
      const response = await this.axiosInstance.get(url, {
        maxRedirects: 0,
        validateStatus: (status) => status >= 200 && status < 400
      });

      return url;
    } catch (error) {
      if (error.response && error.response.headers.location) {
        return error.response.headers.location;
      }
      return url;
    }
  }

  /**
   * 延迟函数
   * @param {number} ms - 延迟毫秒数
   * @returns {Promise} Promise对象
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 设置请求头
   * @param {string} name - 头名称
   * @param {string} value - 头值
   */
  setHeader(name, value) {
    this.axiosInstance.defaults.headers.common[name] = value;
  }

  /**
   * 移除请求头
   * @param {string} name - 头名称
   */
  removeHeader(name) {
    delete this.axiosInstance.defaults.headers.common[name];
  }
}

module.exports = ProxyService;

