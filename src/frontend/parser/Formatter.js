/**
 * 格式转换器
 * 用于将解析后的数据格式化为各种输出格式
 */

class Formatter {
  constructor() {
    this.indentSize = 2;
  }

  /**
   * 格式化为JSON字符串
   * @param {Object} data - 数据对象
   * @param {Object} options - 格式化选项
   * @returns {string} JSON字符串
   */
  toJSON(data, options = {}) {
    const jsonOptions = {
      indent: options.indent !== undefined ? options.indent : this.indentSize,
      sortKeys: options.sortKeys || false,
      excludeEmpty: options.excludeEmpty || false
    };

    let formattedData = data;

    if (jsonOptions.excludeEmpty) {
      formattedData = this.removeEmptyValues(data);
    }

    if (jsonOptions.sortKeys) {
      formattedData = this.sortObjectKeys(formattedData);
    }

    return JSON.stringify(formattedData, null, jsonOptions.indent);
  }

  /**
   * 格式化为简洁文本
   * @param {Object} data - 数据对象
   * @returns {string} 文本字符串
   */
  toText(data) {
    if (!data || typeof data !== 'object') {
      return '';
    }

    const textParts = [];

    // 提取文本内容
    const extractText = (node) => {
      if (!node) return '';

      if (node.type === 'text') {
        return node.text || '';
      }

      if (node.type === 'element' && node.children) {
        return node.children.map(extractText).join(' ').trim();
      }

      return '';
    };

    // 提取所有文本节点
    const extractAllText = (node, depth = 0) => {
      if (!node) return;

      if (node.type === 'text' && node.text) {
        const indent = '  '.repeat(depth);
        textParts.push(indent + node.text);
      }

      if (node.children) {
        node.children.forEach(child => extractAllText(child, depth + 1));
      }
    };

    if (data.root) {
      extractAllText(data.root);
    } else if (data.structure && data.structure.root) {
      extractAllText(data.structure.root);
    }

    return textParts.join('\n');
  }

  /**
   * 格式化为HTML
   * @param {Object} data - 数据对象
   * @returns {string} HTML字符串
   */
  toHTML(data) {
    if (!data || !data.root) {
      return '';
    }

    return this.nodeToHTML(data.root);
  }

  /**
   * 将节点转换为HTML
   * @param {Object} node - 节点对象
   * @returns {string} HTML字符串
   */
  nodeToHTML(node) {
    if (!node) return '';

    switch (node.type) {
      case 'text':
        return this.escapeHTML(node.text || '');

      case 'element':
        const tag = node.tag || 'div';
        const attributes = this.formatAttributes(node.attributes || {});
        const children = (node.children || [])
          .map(child => this.nodeToHTML(child))
          .join('');

        if (this.isSelfClosingTag(tag)) {
          return `<${tag}${attributes} />`;
        }

        return `<${tag}${attributes}>${children}</${tag}>`;

      case 'comment':
        return `<!-- ${this.escapeHTML(node.text || '')} -->`;

      default:
        return '';
    }
  }

  /**
   * 格式化属性
   * @param {Object} attributes - 属性对象
   * @returns {string} 属性字符串
   */
  formatAttributes(attributes) {
    if (!attributes || Object.keys(attributes).length === 0) {
      return '';
    }

    const attrPairs = Object.entries(attributes)
      .map(([key, value]) => {
        if (value === null || value === undefined) {
          return key;
        }
        return `${key}="${this.escapeHTML(String(value))}"`;
      });

    return ' ' + attrPairs.join(' ');
  }

  /**
   * 转义HTML特殊字符
   * @param {string} text - 原始文本
   * @returns {string} 转义后的文本
   */
  escapeHTML(text) {
    if (typeof text !== 'string') {
      return String(text);
    }

    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };

    return text.replace(/[&<>"']/g, m => map[m]);
  }

  /**
   * 检查是否为自闭合标签
   * @param {string} tag - 标签名
   * @returns {boolean} 是否为自闭合标签
   */
  isSelfClosingTag(tag) {
    const selfClosingTags = [
      'img', 'br', 'hr', 'input', 'meta', 'link', 'area',
      'base', 'col', 'embed', 'source', 'track', 'wbr'
    ];
    return selfClosingTags.includes(tag.toLowerCase());
  }

  /**
   * 移除空值
   * @param {Object} obj - 对象
   * @returns {Object} 清理后的对象
   */
  removeEmptyValues(obj) {
    if (Array.isArray(obj)) {
      return obj.map(item => this.removeEmptyValues(item)).filter(item => {
        if (typeof item === 'object' && item !== null) {
          return Object.keys(item).length > 0;
        }
        return item !== null && item !== undefined && item !== '';
      });
    }

    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    const cleaned = {};

    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined || value === '') {
        continue;
      }

      if (Array.isArray(value) && value.length === 0) {
        continue;
      }

      if (typeof value === 'object' && Object.keys(value).length === 0) {
        continue;
      }

      cleaned[key] = this.removeEmptyValues(value);
    }

    return cleaned;
  }

  /**
   * 对对象键进行排序
   * @param {Object} obj - 对象
   * @returns {Object} 排序后的对象
   */
  sortObjectKeys(obj) {
    if (Array.isArray(obj)) {
      return obj.map(item => this.sortObjectKeys(item));
    }

    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    const sorted = {};
    const keys = Object.keys(obj).sort();

    for (const key of keys) {
      sorted[key] = this.sortObjectKeys(obj[key]);
    }

    return sorted;
  }

  /**
   * 格式化为XML
   * @param {Object} data - 数据对象
   * @returns {string} XML字符串
   */
  toXML(data) {
    if (!data || !data.root) {
      return '<?xml version="1.0" encoding="UTF-8"?><root></root>';
    }

    return '<?xml version="1.0" encoding="UTF-8"?>\n' + this.nodeToXML(data.root);
  }

  /**
   * 将节点转换为XML
   * @param {Object} node - 节点对象
   * @param {number} indent - 缩进级别
   * @returns {string} XML字符串
   */
  nodeToXML(node, indent = 0) {
    if (!node) return '';

    const indentStr = '  '.repeat(indent);

    switch (node.type) {
      case 'text':
        return indentStr + this.escapeXML(node.text || '');

      case 'element':
        const tag = node.tag || 'element';
        const attributes = this.formatXMLAttributes(node.attributes || {});
        const children = (node.children || [])
          .map(child => this.nodeToXML(child, indent + 1))
          .filter(child => child.trim())
          .join('\n');

        if (!children) {
          return `${indentStr}<${tag}${attributes} />`;
        }

        return `${indentStr}<${tag}${attributes}>\n${children}\n${indentStr}</${tag}>`;

      case 'comment':
        return `${indentStr}<!-- ${this.escapeXML(node.text || '')} -->`;

      default:
        return '';
    }
  }

  /**
   * 格式化XML属性
   * @param {Object} attributes - 属性对象
   * @returns {string} 属性字符串
   */
  formatXMLAttributes(attributes) {
    if (!attributes || Object.keys(attributes).length === 0) {
      return '';
    }

    const attrPairs = Object.entries(attributes)
      .map(([key, value]) => {
        // XML属性名必须是有效的标识符
        const validKey = key.replace(/[^a-zA-Z0-9_-]/g, '_');
        return `${validKey}="${this.escapeXML(String(value))}"`;
      });

    return ' ' + attrPairs.join(' ');
  }

  /**
   * 转义XML特殊字符
   * @param {string} text - 原始文本
   * @returns {string} 转义后的文本
   */
  escapeXML(text) {
    if (typeof text !== 'string') {
      return String(text);
    }

    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&apos;'
    };

    return text.replace(/[&<>"']/g, m => map[m]);
  }
}

module.exports = Formatter;

