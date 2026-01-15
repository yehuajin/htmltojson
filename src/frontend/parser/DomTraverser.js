/**
 * DOM遍历器
 * 用于遍历DOM树并提取信息
 */

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
    switch (node.nodeType) {
      case Node.ELEMENT_NODE:
        return this.processElement(node, context);
      
      case Node.TEXT_NODE:
        return this.processText(node, context);
      
      case Node.COMMENT_NODE:
        return this.processComment(node, context);
      
      default:
        return null;
    }
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
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: (node) => {
          return node.tagName.toLowerCase() === tagName.toLowerCase()
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT;
        }
      }
    );

    let node;
    while (node = walker.nextNode()) {
      results.push(node);
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

