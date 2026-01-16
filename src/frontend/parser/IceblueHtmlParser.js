/**
 * 冰蓝HTML解析器主类
 * 整合所有解析功能
 */

const DomTraverser = require('./DomTraverser');
const IceblueSpecificParser = require('./IceblueSpecificParser');
const Formatter = require('./Formatter');
const CONSTANTS = require('../../shared/constants/iceblue.constants');
const TYPES = require('../../shared/types/document.types');

class IceblueHtmlParser {
  constructor(options = {}) {
    this.options = {
      includeImages: options.includeImages !== false,
      includeScripts: options.includeScripts || false,
      includeStyles: options.includeStyles || false,
      strictMode: options.strictMode || false,
      depthLimit: options.depthLimit || CONSTANTS.DEFAULTS.MAX_DEPTH,
      textOnly: options.textOnly || false,
      preserveWhitespace: options.preserveWhitespace || false,
      ...options
    };

    this.domTraverser = new DomTraverser({
      maxDepth: this.options.depthLimit,
      onNode: this.onNodeCallback.bind(this),
      onText: this.onTextCallback.bind(this)
    });

    this.specificParser = new IceblueSpecificParser(this.options);
    this.formatter = new Formatter();

    this.collectedImages = [];
    this.collectedLinks = [];
    this.stats = {
      totalElements: 0,
      totalTextLength: 0,
      depth: 0,
      startTime: null,
      endTime: null
    };
  }

  /**
   * 解析HTML字符串
   * @param {string} html - HTML字符串
   * @param {Object} parseOptions - 解析选项
   * @returns {Promise<Object>} 解析结果
   */
  async parse(html, parseOptions = {}) {
    const startTime = Date.now();
    this.stats.startTime = startTime;

    try {
      // 验证HTML
      if (!html || typeof html !== 'string') {
        throw new Error('Invalid HTML input');
      }

      // 合并选项
      const options = { ...this.options, ...parseOptions };

      // 创建DOM
      const document = this.createDOM(html);

      // 解析文档
      const result = await this.parseDocument(document, options);

      // 计算统计信息
      this.stats.endTime = Date.now();
      this.stats.duration = this.stats.endTime - startTime;

      // 构建最终结果
      const parseResult = {
        success: true,
        data: {
          ...result,
          images: this.collectedImages,
          links: this.collectedLinks,
          stats: { ...this.stats }
        },
        duration: this.stats.duration
      };

      return parseResult;

    } catch (error) {
      this.stats.endTime = Date.now();
      return {
        success: false,
        error: error.message,
        errorCode: CONSTANTS.ERROR_CODES.PARSE_FAILED,
        duration: Date.now() - startTime
      };
    } finally {
      this.reset();
    }
  }

  /**
   * 创建DOM对象
   * @param {string} html - HTML字符串
   * @returns {Document|Element} DOM对象
   */
  createDOM(html) {
    if (typeof window !== 'undefined' && window.DOMParser) {
      // 浏览器环境
      try {
        const parser = new DOMParser();
        return parser.parseFromString(html, 'text/html');
      } catch (error) {
        // 如果解析失败，尝试创建临时div
        const div = document.createElement('div');
        div.innerHTML = html;
        return div;
      }
    } else {
      // Node.js环境 - 使用jsdom
      try {
        const { JSDOM } = require('jsdom');
        const dom = new JSDOM(html);
        
        // 将 jsdom 的 window 对象暴露到全局，以便 DomTraverser 可以访问 Node 和 NodeFilter
        if (typeof global !== 'undefined') {
          // 保存原始的全局对象（如果存在）
          if (!global._originalNode) {
            global._originalNode = global.Node;
          }
          if (!global._originalDocument) {
            global._originalDocument = global.document;
          }
          if (!global._originalNodeFilter) {
            global._originalNodeFilter = global.NodeFilter;
          }
          
          // 设置 jsdom 的全局对象
          global.Node = dom.window.Node;
          global.document = dom.window.document;
          global.NodeFilter = dom.window.NodeFilter;
          global.Document = dom.window.Document;
        }
        
        return dom.window.document;
      } catch (error) {
        throw new Error('JSDOM is required in Node.js environment. Please install jsdom: npm install jsdom');
      }
    }
  }

  /**
   * 解析文档
   * @param {Document} document - DOM文档
   * @param {Object} options - 解析选项
   * @returns {Promise<Object>} 解析结果
   */
  async parseDocument(document, options) {
    // 重置状态
    this.reset();

    // 使用特定解析器提取结构化信息
    const specificData = this.specificParser.parse(document);

    // 遍历DOM树
    let rootNode = null;
    
    if (options.textOnly) {
      // 仅提取文本
      rootNode = {
        type: 'text',
        text: document.body ? document.body.textContent.trim() : ''
      };
    } else {
      // 完整解析
      const rootElement = document.documentElement || document.body || document;
      rootNode = this.domTraverser.traverse(rootElement);
    }

    // 构建结果
    const result = {
      metadata: specificData.metadata,
      structure: {
        root: rootNode,
        header: specificData.header,
        footer: specificData.footer,
        navigation: specificData.navigation,
        sidebar: specificData.sidebar,
        articles: specificData.articles,
        mainContent: specificData.mainContent
      }
    };

    // 提取图片和链接
    if (options.includeImages) {
      this.collectedImages = this.extractImages(document);
    }

    this.collectedLinks = this.extractLinks(document);

    // 更新统计信息
    this.updateStats(rootNode);

    return result;
  }

  /**
   * 提取图片信息
   * @param {Document} document - DOM文档
   * @returns {Array<Object>} 图片信息数组
   */
  extractImages(document) {
    const images = [];
    const imgElements = document.querySelectorAll('img');

    imgElements.forEach(img => {
      const imageInfo = {
        src: img.getAttribute('src') || img.getAttribute('data-src') || '',
        alt: img.getAttribute('alt') || '',
        width: img.getAttribute('width') ? parseInt(img.getAttribute('width')) : null,
        height: img.getAttribute('height') ? parseInt(img.getAttribute('height')) : null,
        title: img.getAttribute('title') || ''
      };

      if (imageInfo.src) {
        images.push(imageInfo);
      }
    });

    return images;
  }

  /**
   * 提取链接信息
   * @param {Document} document - DOM文档
   * @returns {Array<Object>} 链接信息数组
   */
  extractLinks(document) {
    const links = [];
    const linkElements = document.querySelectorAll('a');

    linkElements.forEach(link => {
      const linkInfo = {
        href: link.getAttribute('href') || '',
        text: link.textContent.trim(),
        target: link.getAttribute('target') || '',
        rel: link.getAttribute('rel') || '',
        title: link.getAttribute('title') || ''
      };

      if (linkInfo.href) {
        links.push(linkInfo);
      }
    });

    return links;
  }

  /**
   * 更新统计信息
   * @param {Object} node - 根节点
   */
  updateStats(node) {
    if (!node) return;

    const countNodes = (n) => {
      if (n.type === 'element') {
        this.stats.totalElements++;
      }

      if (n.type === 'text' && n.text) {
        this.stats.totalTextLength += n.text.length;
      }

      if (n.children) {
        n.children.forEach(child => countNodes(child));
      }
    };

    countNodes(node);

    // 计算深度
    const calculateDepth = (n, depth = 0) => {
      if (!n || !n.children || n.children.length === 0) {
        return depth;
      }

      let maxDepth = depth;
      n.children.forEach(child => {
        const childDepth = calculateDepth(child, depth + 1);
        maxDepth = Math.max(maxDepth, childDepth);
      });

      return maxDepth;
    };

    this.stats.depth = calculateDepth(node);
  }

  /**
   * 节点回调
   * @param {Object} result - 解析结果
   * @param {Node} node - DOM节点
   * @param {Object} context - 上下文
   */
  onNodeCallback(result, node, context) {
    // 可以在这里添加自定义处理逻辑
  }

  /**
   * 文本回调
   * @param {Object} result - 解析结果
   * @param {Node} node - 文本节点
   * @param {Object} context - 上下文
   */
  onTextCallback(result, node, context) {
    // 可以在这里添加自定义处理逻辑
  }

  /**
   * 格式化输出
   * @param {Object} data - 数据对象
   * @param {string} format - 格式类型 (json, text, html, xml)
   * @param {Object} options - 格式化选项
   * @returns {string} 格式化后的字符串
   */
  format(data, format = 'json', options = {}) {
    switch (format.toLowerCase()) {
      case 'json':
        return this.formatter.toJSON(data, options);
      
      case 'text':
        return this.formatter.toText(data);
      
      case 'html':
        return this.formatter.toHTML(data);
      
      case 'xml':
        return this.formatter.toXML(data);
      
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * 重置解析器状态
   */
  reset() {
    this.collectedImages = [];
    this.collectedLinks = [];
    this.stats = {
      totalElements: 0,
      totalTextLength: 0,
      depth: 0,
      startTime: null,
      endTime: null
    };
    this.domTraverser.reset();
  }
}

module.exports = IceblueHtmlParser;

