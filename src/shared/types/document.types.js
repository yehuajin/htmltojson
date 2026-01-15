/**
 * 文档类型定义
 * 用于定义解析后的JSON结构
 */

/**
 * 基础节点类型
 * @typedef {Object} BaseNode
 * @property {string} type - 节点类型 (element, text, comment)
 * @property {string} [tag] - 标签名 (仅element类型)
 * @property {Object} [attributes] - 属性对象
 * @property {Array<BaseNode>} [children] - 子节点数组
 * @property {string} [text] - 文本内容 (仅text类型)
 */

/**
 * 结构化文档类型
 * @typedef {Object} StructuredDocument
 * @property {Object} metadata - 元数据
 * @property {string} metadata.title - 页面标题
 * @property {Array<string>} metadata.keywords - 关键词
 * @property {string} metadata.description - 描述
 * @property {string} metadata.url - 页面URL
 * @property {Object} structure - 文档结构
 * @property {BaseNode} structure.root - 根节点
 * @property {Array<ImageInfo>} [images] - 图片信息数组
 * @property {Array<LinkInfo>} [links] - 链接信息数组
 * @property {Object} [stats] - 统计信息
 * @property {number} stats.totalElements - 总元素数
 * @property {number} stats.totalTextLength - 总文本长度
 * @property {number} stats.depth - 文档深度
 */

/**
 * 图片信息类型
 * @typedef {Object} ImageInfo
 * @property {string} src - 图片源地址
 * @property {string} [alt] - 替代文本
 * @property {number} [width] - 宽度
 * @property {number} [height] - 高度
 * @property {string} [base64] - Base64编码 (可选)
 */

/**
 * 链接信息类型
 * @typedef {Object} LinkInfo
 * @property {string} href - 链接地址
 * @property {string} [text] - 链接文本
 * @property {string} [target] - 目标窗口
 * @property {string} [rel] - 关系类型
 */

/**
 * 解析选项类型
 * @typedef {Object} ParseOptions
 * @property {boolean} [includeImages=false] - 是否包含图片
 * @property {boolean} [includeScripts=false] - 是否包含脚本
 * @property {boolean} [includeStyles=false] - 是否包含样式
 * @property {boolean} [strictMode=false] - 严格模式
 * @property {number} [depthLimit=100] - 深度限制
 * @property {boolean} [textOnly=false] - 仅提取文本
 * @property {boolean} [preserveWhitespace=false] - 保留空白字符
 */

/**
 * 解析结果类型
 * @typedef {Object} ParseResult
 * @property {boolean} success - 是否成功
 * @property {StructuredDocument} [data] - 解析后的数据
 * @property {string} [error] - 错误信息
 * @property {string} [errorCode] - 错误代码
 * @property {number} [duration] - 解析耗时(毫秒)
 */

module.exports = {
  // 导出类型定义供使用
  nodeTypes: {
    ELEMENT: 'element',
    TEXT: 'text',
    COMMENT: 'comment',
    DOCUMENT: 'document'
  },

  // 创建基础节点
  createBaseNode(type, data = {}) {
    return {
      type,
      ...data,
      timestamp: Date.now()
    };
  },

  // 创建元素节点
  createElementNode(tag, attributes = {}, children = []) {
    return {
      type: 'element',
      tag,
      attributes,
      children
    };
  },

  // 创建文本节点
  createTextNode(text) {
    return {
      type: 'text',
      text: text.trim()
    };
  }
};

