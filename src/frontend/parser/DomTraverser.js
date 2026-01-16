/**
 * DOM遍历器
 * 用于遍历DOM树并提取信息
 */

// 获取 Node 常量的辅助函数（兼容浏览器和 Node.js 环境）
function getNodeConstants() {
  // 浏览器环境
  if (typeof window !== 'undefined' && window.Node) {
    return window.Node;
  }
  // Node.js 环境（jsdom）
  if (typeof global !== 'undefined' && global.Node) {
    return global.Node;
  }
  // 降级：使用数值常量
  return {
    ELEMENT_NODE: 1,
    TEXT_NODE: 3,
    COMMENT_NODE: 8,
    DOCUMENT_NODE: 9
  };
}

// 获取 NodeFilter 常量的辅助函数
function getNodeFilter() {
  if (typeof window !== 'undefined' && window.NodeFilter) {
    return window.NodeFilter;
  }
  if (typeof global !== 'undefined' && global.NodeFilter) {
    return global.NodeFilter;
  }
  // 降级：使用数值常量
  return {
    SHOW_ELEMENT: 1,
    FILTER_ACCEPT: 1,
    FILTER_REJECT: 2
  };
}

// 获取 document 对象的辅助函数
function getDocument(node) {
  if (node && node.ownerDocument) {
    return node.ownerDocument;
  }
  if (typeof window !== 'undefined' && window.document) {
    return window.document;
  }
  if (typeof global !== 'undefined' && global.document) {
    return global.document;
  }
  return null;
}

class DomTraverser {
  constructor(options = {}) {
    this.maxDepth = options.maxDepth || 100;
    this.currentDepth = 0;
    this.onNodeCallback = options.onNode || null;
    this.onTextCallback = options.onText || null;
  }

  /**
   * 遍历DOM节点
   * @param {Node} node - DOM节点
   * @param {Object} context - 上下文信息
   * @returns {Object} 解析后的节点对象
   */
  traverse(node, context = {}) {
    if (this.currentDepth >= this.maxDepth) {
      return null;
    }

    const result = this.processNode(node, context);
    
    if (result && node.childNodes && node.childNodes.length > 0) {
      this.currentDepth++;
      result.children = [];
      
      for (const child of node.childNodes) {
        const childResult = this.traverse(child, {
          ...context,
          parent: node,
          index: result.children.length
        });
        
        if (childResult) {
          result.children.push(childResult);
        }
      }
      
      this.currentDepth--;
    }

    // 调用回调函数
    if (this.onNodeCallback && result) {
      this.onNodeCallback(result, node, context);
    }

    return result;
  }

  /**
   * 处理单个节点
   * @param {Node} node - DOM节点
   * @param {Object} context - 上下文信息
   * @returns {Object|null} 节点对象
   */
  processNode(node, context) {
    const Node = getNodeConstants();
    const nodeType = node.nodeType;
    
    if (nodeType === Node.ELEMENT_NODE || nodeType === 1) {
      return this.processElement(node, context);
    }
    
    if (nodeType === Node.TEXT_NODE || nodeType === 3) {
      return this.processText(node, context);
    }
    
    if (nodeType === Node.COMMENT_NODE || nodeType === 8) {
      return this.processComment(node, context);
    }
    
    return null;
  }

  /**
   * 处理元素节点
   * @param {Element} element - 元素节点
   * @param {Object} context - 上下文信息
   * @returns {Object} 元素对象
   */
  processElement(element, context) {
    const result = {
      type: 'element',
      tag: element.tagName.toLowerCase(),
      attributes: {}
    };

    // 提取属性
    if (element.attributes) {
      for (const attr of element.attributes) {
        result.attributes[attr.name] = attr.value;
      }
    }

    // 提取特殊属性
    if (element.id) {
      result.attributes.id = element.id;
    }

    if (element.className) {
      result.attributes.class = element.className;
    }

    return result;
  }

  /**
   * 处理文本节点
   * @param {Text} textNode - 文本节点
   * @param {Object} context - 上下文信息
   * @returns {Object|null} 文本对象
   */
  processText(textNode, context) {
    const text = textNode.textContent.trim();
    
    if (!text) {
      return null; // 忽略空白文本节点
    }

    const result = {
      type: 'text',
      text: text
    };

    // 调用文本回调
    if (this.onTextCallback) {
      this.onTextCallback(result, textNode, context);
    }

    return result;
  }

  /**
   * 处理注释节点
   * @param {Comment} commentNode - 注释节点
   * @param {Object} context - 上下文信息
   * @returns {Object} 注释对象
   */
  processComment(commentNode, context) {
    return {
      type: 'comment',
      text: commentNode.textContent
    };
  }

  /**
   * 重置遍历器状态
   */
  reset() {
    this.currentDepth = 0;
  }

  /**
   * 批量遍历节点
   * @param {NodeList|Array} nodes - 节点列表
   * @param {Object} context - 上下文信息
   * @returns {Array} 解析后的节点数组
   */
  traverseNodes(nodes, context = {}) {
    const results = [];
    
    for (const node of nodes) {
      const result = this.traverse(node, context);
      if (result) {
        results.push(result);
      }
    }
    
    return results;
  }

  /**
   * 查找特定类型的节点
   * @param {Node} root - 根节点
   * @param {string} tagName - 标签名
   * @returns {Array} 匹配的节点数组
   */
  findNodesByTag(root, tagName) {
    const results = [];
    const doc = getDocument(root);
    const NodeFilter = getNodeFilter();
    
    if (!doc || typeof doc.createTreeWalker !== 'function') {
      // 降级：使用递归查找
      const findRecursive = (node) => {
        const Node = getNodeConstants();
        if (node.nodeType === Node.ELEMENT_NODE || node.nodeType === 1) {
          if (node.tagName && node.tagName.toLowerCase() === tagName.toLowerCase()) {
            results.push(node);
          }
        }
        if (node.childNodes) {
          for (const child of node.childNodes) {
            findRecursive(child);
          }
        }
      };
      findRecursive(root);
      return results;
    }
    
    try {
      const walker = doc.createTreeWalker(
        root,
        NodeFilter.SHOW_ELEMENT || 1,
        {
          acceptNode: (node) => {
            if (!node.tagName) return NodeFilter.FILTER_REJECT || 2;
            return node.tagName.toLowerCase() === tagName.toLowerCase()
              ? (NodeFilter.FILTER_ACCEPT || 1)
              : (NodeFilter.FILTER_REJECT || 2);
          }
        }
      );

      let node;
      while (node = walker.nextNode()) {
        results.push(node);
      }
    } catch (error) {
      // 如果 TreeWalker 失败，使用递归方法
      const findRecursive = (node) => {
        const Node = getNodeConstants();
        if (node.nodeType === Node.ELEMENT_NODE || node.nodeType === 1) {
          if (node.tagName && node.tagName.toLowerCase() === tagName.toLowerCase()) {
            results.push(node);
          }
        }
        if (node.childNodes) {
          for (const child of node.childNodes) {
            findRecursive(child);
          }
        }
      };
      findRecursive(root);
    }

    return results;
  }

  /**
   * 查找包含特定类的节点
   * @param {Node} root - 根节点
   * @param {string} className - 类名
   * @returns {Array} 匹配的节点数组
   */
  findNodesByClass(root, className) {
    if (typeof root.querySelectorAll === 'function') {
      return Array.from(root.querySelectorAll(`.${className}`));
    }
    // 降级处理：如果没有querySelectorAll方法，返回空数组
    return [];
  }
}

module.exports = DomTraverser;

