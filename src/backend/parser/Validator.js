/**
 * 数据验证器
 * 用于验证解析后的数据结构
 */

const CONSTANTS = require('../../shared/constants/iceblue.constants');
const TYPES = require('../../shared/types/document.types');

class Validator {
  constructor(options = {}) {
    this.options = {
      strict: options.strict || false,
      maxDepth: options.maxDepth || CONSTANTS.DEFAULTS.MAX_DEPTH,
      maxTextLength: options.maxTextLength || CONSTANTS.DEFAULTS.MAX_TEXT_LENGTH,
      ...options
    };
  }

  /**
   * 验证解析结果
   * @param {Object} result - 解析结果
   * @returns {Object} 验证结果
   */
  validate(result) {
    const errors = [];
    const warnings = [];

    if (!result) {
      return {
        valid: false,
        errors: ['Result is null or undefined'],
        warnings: []
      };
    }

    // 验证基本结构
    if (result.success === undefined) {
      errors.push('Missing success field');
    }

    if (result.success && result.data) {
      const dataErrors = this.validateData(result.data);
      errors.push(...dataErrors.errors);
      warnings.push(...dataErrors.warnings);
    }

    if (!result.success && !result.error) {
      warnings.push('Error result missing error message');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 验证数据对象
   * @param {Object} data - 数据对象
   * @returns {Object} 验证结果
   */
  validateData(data) {
    const errors = [];
    const warnings = [];

    // 验证元数据
    if (data.metadata) {
      const metadataErrors = this.validateMetadata(data.metadata);
      errors.push(...metadataErrors.errors);
      warnings.push(...metadataErrors.warnings);
    }

    // 验证结构
    if (data.structure) {
      const structureErrors = this.validateStructure(data.structure);
      errors.push(...structureErrors.errors);
      warnings.push(...structureErrors.warnings);
    }

    // 验证统计信息
    if (data.stats) {
      const statsErrors = this.validateStats(data.stats);
      errors.push(...statsErrors.errors);
      warnings.push(...statsErrors.warnings);
    }

    // 验证图片数组
    if (data.images) {
      if (!Array.isArray(data.images)) {
        errors.push('Images must be an array');
      } else {
        data.images.forEach((img, index) => {
          const imgErrors = this.validateImage(img);
          imgErrors.errors.forEach(err => errors.push(`Image[${index}]: ${err}`));
          imgErrors.warnings.forEach(warn => warnings.push(`Image[${index}]: ${warn}`));
        });
      }
    }

    // 验证链接数组
    if (data.links) {
      if (!Array.isArray(data.links)) {
        errors.push('Links must be an array');
      } else {
        data.links.forEach((link, index) => {
          const linkErrors = this.validateLink(link);
          linkErrors.errors.forEach(err => errors.push(`Link[${index}]: ${err}`));
          linkErrors.warnings.forEach(warn => warnings.push(`Link[${index}]: ${warn}`));
        });
      }
    }

    return { errors, warnings };
  }

  /**
   * 验证元数据
   * @param {Object} metadata - 元数据对象
   * @returns {Object} 验证结果
   */
  validateMetadata(metadata) {
    const errors = [];
    const warnings = [];

    if (typeof metadata !== 'object' || metadata === null) {
      errors.push('Metadata must be an object');
      return { errors, warnings };
    }

    // 验证标题
    if (metadata.title !== undefined && typeof metadata.title !== 'string') {
      errors.push('Metadata title must be a string');
    }

    // 验证描述
    if (metadata.description !== undefined && typeof metadata.description !== 'string') {
      errors.push('Metadata description must be a string');
    }

    // 验证关键词
    if (metadata.keywords !== undefined) {
      if (!Array.isArray(metadata.keywords)) {
        errors.push('Metadata keywords must be an array');
      } else {
        metadata.keywords.forEach((keyword, index) => {
          if (typeof keyword !== 'string') {
            errors.push(`Metadata keywords[${index}] must be a string`);
          }
        });
      }
    }

    // 验证URL
    if (metadata.url !== undefined && typeof metadata.url !== 'string') {
      errors.push('Metadata url must be a string');
    }

    return { errors, warnings };
  }

  /**
   * 验证结构
   * @param {Object} structure - 结构对象
   * @returns {Object} 验证结果
   */
  validateStructure(structure) {
    const errors = [];
    const warnings = [];

    if (typeof structure !== 'object' || structure === null) {
      errors.push('Structure must be an object');
      return { errors, warnings };
    }

    // 验证根节点
    if (structure.root) {
      const rootErrors = this.validateNode(structure.root, 0);
      errors.push(...rootErrors.errors);
      warnings.push(...rootErrors.warnings);
    } else if (this.options.strict) {
      warnings.push('Structure missing root node');
    }

    return { errors, warnings };
  }

  /**
   * 验证节点
   * @param {Object} node - 节点对象
   * @param {number} depth - 当前深度
   * @returns {Object} 验证结果
   */
  validateNode(node, depth = 0) {
    const errors = [];
    const warnings = [];

    if (!node || typeof node !== 'object') {
      errors.push('Node must be an object');
      return { errors, warnings };
    }

    // 检查深度
    if (depth > this.options.maxDepth) {
      errors.push(`Node depth exceeds maximum depth of ${this.options.maxDepth}`);
      return { errors, warnings };
    }

    // 验证类型
    if (!node.type) {
      errors.push('Node missing type field');
    } else if (!['element', 'text', 'comment', 'document'].includes(node.type)) {
      errors.push(`Invalid node type: ${node.type}`);
    }

    // 验证元素节点
    if (node.type === 'element') {
      if (!node.tag || typeof node.tag !== 'string') {
        errors.push('Element node missing or invalid tag');
      }

      if (node.attributes && typeof node.attributes !== 'object') {
        errors.push('Element node attributes must be an object');
      }
    }

    // 验证文本节点
    if (node.type === 'text') {
      if (node.text === undefined) {
        errors.push('Text node missing text field');
      } else if (typeof node.text !== 'string') {
        errors.push('Text node text must be a string');
      } else if (node.text.length > this.options.maxTextLength) {
        warnings.push(`Text node text length exceeds recommended maximum of ${this.options.maxTextLength}`);
      }
    }

    // 验证子节点
    if (node.children) {
      if (!Array.isArray(node.children)) {
        errors.push('Node children must be an array');
      } else {
        node.children.forEach((child, index) => {
          const childErrors = this.validateNode(child, depth + 1);
          childErrors.errors.forEach(err => errors.push(`Child[${index}]: ${err}`));
          childErrors.warnings.forEach(warn => warnings.push(`Child[${index}]: ${warn}`));
        });
      }
    }

    return { errors, warnings };
  }

  /**
   * 验证统计信息
   * @param {Object} stats - 统计对象
   * @returns {Object} 验证结果
   */
  validateStats(stats) {
    const errors = [];
    const warnings = [];

    if (typeof stats !== 'object' || stats === null) {
      errors.push('Stats must be an object');
      return { errors, warnings };
    }

    // 验证数值字段
    const numericFields = ['totalElements', 'totalTextLength', 'depth', 'duration'];
    numericFields.forEach(field => {
      if (stats[field] !== undefined && typeof stats[field] !== 'number') {
        errors.push(`Stats ${field} must be a number`);
      }
    });

    return { errors, warnings };
  }

  /**
   * 验证图片信息
   * @param {Object} image - 图片对象
   * @returns {Object} 验证结果
   */
  validateImage(image) {
    const errors = [];
    const warnings = [];

    if (!image || typeof image !== 'object') {
      errors.push('Image must be an object');
      return { errors, warnings };
    }

    if (!image.src || typeof image.src !== 'string') {
      errors.push('Image missing or invalid src field');
    }

    if (image.width !== undefined && (typeof image.width !== 'number' || image.width < 0)) {
      errors.push('Image width must be a non-negative number');
    }

    if (image.height !== undefined && (typeof image.height !== 'number' || image.height < 0)) {
      errors.push('Image height must be a non-negative number');
    }

    return { errors, warnings };
  }

  /**
   * 验证链接信息
   * @param {Object} link - 链接对象
   * @returns {Object} 验证结果
   */
  validateLink(link) {
    const errors = [];
    const warnings = [];

    if (!link || typeof link !== 'object') {
      errors.push('Link must be an object');
      return { errors, warnings };
    }

    if (!link.href || typeof link.href !== 'string') {
      errors.push('Link missing or invalid href field');
    }

    if (link.text !== undefined && typeof link.text !== 'string') {
      errors.push('Link text must be a string');
    }

    return { errors, warnings };
  }

  /**
   * 快速验证（仅检查基本结构）
   * @param {Object} result - 解析结果
   * @returns {boolean} 是否有效
   */
  quickValidate(result) {
    if (!result) return false;
    if (result.success === undefined) return false;
    if (result.success && !result.data) return false;
    if (!result.success && !result.error) return false;
    return true;
  }
}

module.exports = Validator;

