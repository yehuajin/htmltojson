/**
 * Polyfills for Node.js compatibility
 * 在 Node.js 18.12.0 中提供 File API polyfill
 */

// 检查是否需要添加 polyfill
if (typeof globalThis.File === 'undefined') {
  // 简单的 File polyfill
  class FilePolyfill {
    constructor(bits, name, options = {}) {
      this.name = name;
      this.lastModified = options.lastModified || Date.now();
      this.size = 0;
      this.type = options.type || '';
      
      if (bits && bits.length) {
        this.size = bits.reduce((total, bit) => {
          if (typeof bit === 'string') {
            return total + new TextEncoder().encode(bit).length;
          }
          if (bit instanceof ArrayBuffer) {
            return total + bit.byteLength;
          }
          if (bit instanceof Blob) {
            return total + bit.size;
          }
          return total;
        }, 0);
      }
      
      this._bits = bits;
    }
    
    async arrayBuffer() {
      if (this._bits) {
        const buffers = await Promise.all(
          this._bits.map(async (bit) => {
            if (bit instanceof ArrayBuffer) return bit;
            if (bit instanceof Blob) return await bit.arrayBuffer();
            if (typeof bit === 'string') {
              return new TextEncoder().encode(bit).buffer;
            }
            return new ArrayBuffer(0);
          })
        );
        return buffers.reduce((total, buffer) => {
          const combined = new Uint8Array(total.byteLength + buffer.byteLength);
          combined.set(new Uint8Array(total), 0);
          combined.set(new Uint8Array(buffer), total.byteLength);
          return combined.buffer;
        }, new ArrayBuffer(0));
      }
      return new ArrayBuffer(0);
    }
    
    async text() {
      const buffer = await this.arrayBuffer();
      return new TextDecoder().decode(buffer);
    }
    
    stream() {
      // 简单的流实现
      const chunks = this._bits || [];
      let index = 0;
      
      return new ReadableStream({
        async pull(controller) {
          if (index >= chunks.length) {
            controller.close();
            return;
          }
          
          const chunk = chunks[index++];
          if (chunk instanceof ArrayBuffer) {
            controller.enqueue(new Uint8Array(chunk));
          } else if (chunk instanceof Blob) {
            const buffer = await chunk.arrayBuffer();
            controller.enqueue(new Uint8Array(buffer));
          } else if (typeof chunk === 'string') {
            controller.enqueue(new TextEncoder().encode(chunk));
          }
        }
      });
    }
  }
  
  // 设置全局 File
  globalThis.File = FilePolyfill;
  
  // 如果 Blob 也不存在，添加简单的 Blob polyfill
  if (typeof globalThis.Blob === 'undefined') {
    class BlobPolyfill {
      constructor(blobParts = [], options = {}) {
        this.size = 0;
        this.type = options.type || '';
        
        if (blobParts && blobParts.length) {
          this.size = blobParts.reduce((total, part) => {
            if (typeof part === 'string') {
              return total + new TextEncoder().encode(part).length;
            }
            if (part instanceof ArrayBuffer) {
              return total + part.byteLength;
            }
            return total;
          }, 0);
        }
        
        this._parts = blobParts;
      }
      
      async arrayBuffer() {
        if (this._parts && this._parts.length) {
          const buffers = await Promise.all(
            this._parts.map(async (part) => {
              if (part instanceof ArrayBuffer) return part;
              if (part instanceof BlobPolyfill) return await part.arrayBuffer();
              if (typeof part === 'string') {
                return new TextEncoder().encode(part).buffer;
              }
              return new ArrayBuffer(0);
            })
          );
          return buffers.reduce((total, buffer) => {
            const combined = new Uint8Array(total.byteLength + buffer.byteLength);
            combined.set(new Uint8Array(total), 0);
            combined.set(new Uint8Array(buffer), total.byteLength);
            return combined.buffer;
          }, new ArrayBuffer(0));
        }
        return new ArrayBuffer(0);
      }
      
      async text() {
        const buffer = await this.arrayBuffer();
        return new TextDecoder().decode(buffer);
      }
    }
    
    globalThis.Blob = BlobPolyfill;
  }
}

// 确保 ReadableStream 存在（Node.js 18+ 应该支持，但检查一下）
if (typeof globalThis.ReadableStream === 'undefined') {
  // 如果 Node.js 版本不支持，使用 stream/web 的 ReadableStream
  try {
    const { ReadableStream } = require('stream/web');
    if (ReadableStream) {
      globalThis.ReadableStream = ReadableStream;
    }
  } catch (e) {
    // Node.js 18.12.0 应该支持 ReadableStream，如果不存在可能是其他问题
    console.warn('ReadableStream may not be available:', e.message);
  }
}

module.exports = {};

