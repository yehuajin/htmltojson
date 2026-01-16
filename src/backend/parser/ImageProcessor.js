/**
 * 图片处理器
 * 用于处理图片相关操作，如下载、转换、优化等
 */

const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const UrlUtils = require('../../frontend/utils/UrlUtils');

// 尝试加载 sharp，如果失败则设为 null
let sharp = null;
try {
  sharp = require('sharp');
} catch (error) {
  // sharp 未安装或加载失败，图片优化功能将不可用
  console.warn('sharp is not installed. Image optimization features will be disabled.');
  console.warn('To enable image processing, install sharp: npm install sharp');
}

class ImageProcessor {
  constructor(options = {}) {
    this.options = {
      download: options.download || false,
      convertToBase64: options.convertToBase64 || false,
      optimize: options.optimize || false,
      maxWidth: options.maxWidth || 1920,
      maxHeight: options.maxHeight || 1080,
      quality: options.quality || 80,
      outputDir: options.outputDir || './images',
      timeout: options.timeout || 5000,
      ...options
    };

    // 检查 sharp 是否可用
    this.hasSharp = sharp !== null;

    // 如果启用了优化但 sharp 不可用，发出警告
    if (this.options.optimize && !this.hasSharp) {
      console.warn('Image optimization is enabled but sharp is not available. Optimization will be skipped.');
      this.options.optimize = false;
    }

    // 确保输出目录存在
    if (this.options.download || this.options.outputDir) {
      this.ensureOutputDir();
    }
  }

  /**
   * 确保输出目录存在
   */
  async ensureOutputDir() {
    try {
      await fs.mkdir(this.options.outputDir, { recursive: true });
    } catch (error) {
      console.warn('Failed to create output directory:', error.message);
    }
  }

  /**
   * 处理图片
   * @param {string} imageUrl - 图片URL
   * @param {Object} options - 处理选项
   * @returns {Promise<Object>} 处理结果
   */
  async process(imageUrl, options = {}) {
    const processOptions = { ...this.options, ...options };
    
    try {
      const result = {
        src: imageUrl,
        processed: false,
        data: null
      };

      // 下载图片
      if (processOptions.download || processOptions.convertToBase64 || processOptions.optimize) {
        const imageData = await this.download(imageUrl, processOptions);
        result.data = imageData;

        // 转换为Base64
        if (processOptions.convertToBase64 && imageData.buffer) {
          result.base64 = this.bufferToBase64(imageData.buffer, imageData.mimeType);
        }

        // 优化图片
        if (processOptions.optimize && imageData.buffer) {
          const optimized = await this.optimize(imageData.buffer, processOptions);
          result.optimized = optimized;
          result.data = { ...result.data, ...optimized };
        }

        result.processed = true;
      }

      // 获取图片信息
      if (processOptions.getInfo) {
        result.info = await this.getImageInfo(imageUrl, processOptions);
      }

      return result;
    } catch (error) {
      return {
        src: imageUrl,
        processed: false,
        error: error.message
      };
    }
  }

  /**
   * 下载图片
   * @param {string} url - 图片URL
   * @param {Object} options - 下载选项
   * @returns {Promise<Object>} 图片数据
   */
  async download(url, options = {}) {
    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: options.timeout || this.options.timeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const buffer = Buffer.from(response.data, 'binary');
      const mimeType = response.headers['content-type'] || 'image/jpeg';

      // 保存到本地
      if (options.saveToDisk) {
        const filename = this.generateFilename(url);
        const filepath = path.join(this.options.outputDir, filename);
        await fs.writeFile(filepath, buffer);
      }

      return {
        buffer,
        mimeType,
        size: buffer.length,
        url
      };
    } catch (error) {
      throw new Error(`Failed to download image: ${error.message}`);
    }
  }

  /**
   * 优化图片
   * @param {Buffer} buffer - 图片缓冲区
   * @param {Object} options - 优化选项
   * @returns {Promise<Object>} 优化后的图片数据
   */
  async optimize(buffer, options = {}) {
    if (!this.hasSharp) {
      throw new Error('Image optimization requires sharp. Please install it: npm install sharp');
    }

    try {
      let image = sharp(buffer);

      // 获取原始信息
      const metadata = await image.metadata();

      // 调整大小
      if (options.maxWidth || options.maxHeight || this.options.maxWidth || this.options.maxHeight) {
        const maxWidth = options.maxWidth || this.options.maxWidth;
        const maxHeight = options.maxHeight || this.options.maxHeight;

        if (metadata.width > maxWidth || metadata.height > maxHeight) {
          image = image.resize(maxWidth, maxHeight, {
            fit: 'inside',
            withoutEnlargement: true
          });
        }
      }

      // 转换为JPEG并压缩
      const optimizedBuffer = await image
        .jpeg({ quality: options.quality || this.options.quality })
        .toBuffer();

      const optimizedMetadata = await sharp(optimizedBuffer).metadata();

      return {
        buffer: optimizedBuffer,
        size: optimizedBuffer.length,
        width: optimizedMetadata.width,
        height: optimizedMetadata.height,
        format: optimizedMetadata.format,
        mimeType: `image/${optimizedMetadata.format}`
      };
    } catch (error) {
      throw new Error(`Failed to optimize image: ${error.message}`);
    }
  }

  /**
   * 获取图片信息
   * @param {string} url - 图片URL
   * @param {Object} options - 选项
   * @returns {Promise<Object>} 图片信息
   */
  async getImageInfo(url, options = {}) {
    if (!this.hasSharp) {
      // 降级：只返回基本信息
      try {
        const imageData = await this.download(url, { ...options, saveToDisk: false });
        return {
          size: imageData.size,
          mimeType: imageData.mimeType,
          width: null,
          height: null,
          format: null,
          note: 'Detailed image info requires sharp. Install it: npm install sharp'
        };
      } catch (error) {
        throw new Error(`Failed to get image info: ${error.message}`);
      }
    }

    try {
      const imageData = await this.download(url, { ...options, saveToDisk: false });
      const metadata = await sharp(imageData.buffer).metadata();

      return {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: imageData.size,
        mimeType: imageData.mimeType,
        hasAlpha: metadata.hasAlpha,
        channels: metadata.channels,
        space: metadata.space
      };
    } catch (error) {
      throw new Error(`Failed to get image info: ${error.message}`);
    }
  }

  /**
   * 批量处理图片
   * @param {Array<string>} urls - 图片URL数组
   * @param {Object} options - 处理选项
   * @returns {Promise<Array>} 处理结果数组
   */
  async processBatch(urls, options = {}) {
    const results = [];
    
    for (const url of urls) {
      try {
        const result = await this.process(url, options);
        results.push(result);
      } catch (error) {
        results.push({
          src: url,
          processed: false,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * 将缓冲区转换为Base64
   * @param {Buffer} buffer - 缓冲区
   * @param {string} mimeType - MIME类型
   * @returns {string} Base64字符串
   */
  bufferToBase64(buffer, mimeType = 'image/jpeg') {
    const base64 = buffer.toString('base64');
    return `data:${mimeType};base64,${base64}`;
  }

  /**
   * 生成文件名
   * @param {string} url - 图片URL
   * @returns {string} 文件名
   */
  generateFilename(url) {
    const extension = UrlUtils.getExtension(url) || 'jpg';
    const hash = crypto.createHash('md5').update(url).digest('hex');
    return `${hash}.${extension}`;
  }

  /**
   * 检查图片是否可访问
   * @param {string} url - 图片URL
   * @returns {Promise<boolean>} 是否可访问
   */
  async isAccessible(url) {
    try {
      const response = await axios.head(url, {
        timeout: this.options.timeout
      });
      return response.status >= 200 && response.status < 400;
    } catch (error) {
      return false;
    }
  }

  /**
   * 验证图片格式
   * @param {Buffer} buffer - 图片缓冲区
   * @returns {Promise<boolean>} 是否为有效图片
   */
  async validateImage(buffer) {
    if (!this.hasSharp) {
      // 降级：简单检查文件头
      const imageSignatures = [
        [0xFF, 0xD8, 0xFF], // JPEG
        [0x89, 0x50, 0x4E, 0x47], // PNG
        [0x47, 0x49, 0x46], // GIF
        [0x52, 0x49, 0x46, 0x46] // WEBP (RIFF)
      ];

      const bufferStart = Array.from(buffer.slice(0, 4));
      return imageSignatures.some(sig => 
        sig.every((byte, index) => bufferStart[index] === byte)
      );
    }

    try {
      await sharp(buffer).metadata();
      return true;
    } catch (error) {
      return false;
    }
  }
}

module.exports = ImageProcessor;

