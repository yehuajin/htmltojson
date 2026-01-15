/**
 * 后端解析器
 * 在Node.js环境中解析HTML
 */

const { JSDOM } = require('jsdom');
const cheerio = require('cheerio');
const IceblueHtmlParser = require('../../frontend/parser/IceblueHtmlParser');
const Validator = require('./Validator');
const ImageProcessor = require('./ImageProcessor');
const ProxyService = require('../proxy/ProxyService');

class BackendParser {
  constructor(options = {}) {
    this.options = {
      includeImages: options.includeImages !== false,
      includeScripts: options.includeScripts || false,
      includeStyles: options.includeStyles || false,
      strictMode: options.strictMode || false,
      validate: options.validate !== false,
      processImages: options.processImages || false,
      ...options
    };

    // 初始化组件
    this.parser = new IceblueHtmlParser(this.options);
    this.validator = new Validator({ strict: this.options.strictMode });
    this.imageProcessor = this.options.processImages 
      ? new ImageProcessor(this.options.imageProcessor || {})
      : null;
    this.proxyService = new ProxyService(this.options.proxy || {});
  }

  /**
   * 解析HTML字符串
   * @param {string} html - HTML字符串
   * @param {Object} parseOptions - 解析选项
   * @returns {Promise<Object>} 解析结果
   */
  async parse(html, parseOptions = {}) {
    const startTime = Date.now();

    try {
      // 合并选项
      const options = { ...this.options, ...parseOptions };

      // 使用前端解析器解析
      const result = await this.parser.parse(html, options);

      // 处理图片
      if (result.success && options.processImages && result.data.images) {
        result.data.images = await this.processImages(result.data.images, options);
      }

      // 验证结果
      if (options.validate && result.success) {
        const validation = this.validator.validate(result);
        result.validation = validation;

        // 如果严格模式且有错误，标记为失败
        if (options.strictMode && !validation.valid) {
          result.success = false;
          result.error = `Validation failed: ${validation.errors.join(', ')}`;
          result.errorCode = 'VALIDATION_ERROR';
        }
      }

      result.duration = Date.now() - startTime;
      return result;

    } catch (error) {
      return {
        success: false,
        error: error.message,
        errorCode: 'PARSE_FAILED',
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * 从URL解析HTML
   * @param {string} url - URL地址
   * @param {Object} parseOptions - 解析选项
   * @returns {Promise<Object>} 解析结果
   */
  async parseUrl(url, parseOptions = {}) {
    const startTime = Date.now();

    try {
      // 获取HTML内容
      const htmlResult = await this.proxyService.fetchHTML(url, {
        timeout: parseOptions.timeout || 30000
      });

      if (!htmlResult.success) {
        return {
          success: false,
          error: htmlResult.error || 'Failed to fetch HTML',
          errorCode: 'NETWORK_ERROR',
          duration: Date.now() - startTime
        };
      }

      // 解析HTML
      const result = await this.parse(htmlResult.data, {
        ...parseOptions,
        url
      });

      result.url = url;
      return result;

    } catch (error) {
      return {
        success: false,
        error: error.message,
        errorCode: 'PARSE_FAILED',
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * 处理图片
   * @param {Array<Object>} images - 图片信息数组
   * @param {Object} options - 处理选项
   * @returns {Promise<Array<Object>>} 处理后的图片数组
   */
  async processImages(images, options = {}) {
    if (!this.imageProcessor || !images || images.length === 0) {
      return images;
    }

    const processOptions = {
      convertToBase64: options.convertImagesToBase64 || false,
      optimize: options.optimizeImages || false,
      getInfo: true,
      ...options.imageProcessor
    };

    const results = await this.imageProcessor.processBatch(
      images.map(img => img.src),
      processOptions
    );

    // 合并结果
    return images.map((img, index) => {
      const processed = results[index];
      return {
        ...img,
        ...processed,
        processed: processed.processed || false
      };
    });
  }

  /**
   * 使用Cheerio解析（更快的轻量级解析）
   * @param {string} html - HTML字符串
   * @param {Object} options - 解析选项
   * @returns {Object} 解析结果
   */
  parseWithCheerio(html, options = {}) {
    try {
      const $ = cheerio.load(html);
      const result = {
        success: true,
        data: {
          metadata: this.extractMetadataWithCheerio($),
          structure: {
            html: $.html(),
            text: $.text()
          },
          images: this.extractImagesWithCheerio($),
          links: this.extractLinksWithCheerio($)
        }
      };

      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message,
        errorCode: 'PARSE_FAILED'
      };
    }
  }

  /**
   * 使用Cheerio提取元数据
   * @param {CheerioStatic} $ - Cheerio实例
   * @returns {Object} 元数据
   */
  extractMetadataWithCheerio($) {
    return {
      title: $('title').text().trim(),
      description: $('meta[name="description"]').attr('content') || '',
      keywords: ($('meta[name="keywords"]').attr('content') || '').split(',').map(k => k.trim()),
      url: $('link[rel="canonical"]').attr('href') || ''
    };
  }

  /**
   * 使用Cheerio提取图片
   * @param {CheerioStatic} $ - Cheerio实例
   * @returns {Array<Object>} 图片数组
   */
  extractImagesWithCheerio($) {
    const images = [];
    $('img').each((index, element) => {
      const $img = $(element);
      images.push({
        src: $img.attr('src') || $img.attr('data-src') || '',
        alt: $img.attr('alt') || '',
        width: $img.attr('width') ? parseInt($img.attr('width')) : null,
        height: $img.attr('height') ? parseInt($img.attr('height')) : null
      });
    });
    return images;
  }

  /**
   * 使用Cheerio提取链接
   * @param {CheerioStatic} $ - Cheerio实例
   * @returns {Array<Object>} 链接数组
   */
  extractLinksWithCheerio($) {
    const links = [];
    $('a').each((index, element) => {
      const $link = $(element);
      links.push({
        href: $link.attr('href') || '',
        text: $link.text().trim(),
        target: $link.attr('target') || ''
      });
    });
    return links;
  }

  /**
   * 批量解析
   * @param {Array<string>} htmls - HTML字符串数组
   * @param {Object} options - 解析选项
   * @returns {Promise<Array<Object>>} 解析结果数组
   */
  async parseBatch(htmls, options = {}) {
    const results = [];

    for (const html of htmls) {
      try {
        const result = await this.parse(html, options);
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          error: error.message,
          errorCode: 'PARSE_FAILED'
        });
      }
    }

    return results;
  }

  /**
   * 批量解析URL
   * @param {Array<string>} urls - URL数组
   * @param {Object} options - 解析选项
   * @returns {Promise<Array<Object>>} 解析结果数组
   */
  async parseBatchUrls(urls, options = {}) {
    const results = [];

    for (const url of urls) {
      try {
        const result = await this.parseUrl(url, options);
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          error: error.message,
          errorCode: 'PARSE_FAILED',
          url
        });
      }
    }

    return results;
  }
}

module.exports = BackendParser;

