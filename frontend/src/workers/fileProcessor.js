// fileProcessor.js - Web Worker for file processing operations
// Handles file uploads, downloads, compression, and data processing

class FileProcessor {
  constructor() {
    this.maxConcurrentOperations = Math.min(__CPU_CORES__ || 4, 8);
    this.activeOperations = new Map();
    this.operationQueue = [];
  }

  async processFile(file, operation, options = {}) {
    const operationId = `${operation}_${Date.now()}_${Math.random()}`;
    
    return new Promise((resolve, reject) => {
      const task = {
        id: operationId,
        file,
        operation,
        options,
        resolve,
        reject,
        startTime: Date.now()
      };

      if (this.activeOperations.size < this.maxConcurrentOperations) {
        this.executeTask(task);
      } else {
        this.operationQueue.push(task);
      }
    });
  }

  async executeTask(task) {
    this.activeOperations.set(task.id, task);
    
    try {
      let result;
      
      switch (task.operation) {
        case 'compress':
          result = await this.compressFile(task.file, task.options);
          break;
        case 'decompress':
          result = await this.decompressFile(task.file, task.options);
          break;
        case 'encrypt':
          result = await this.encryptFile(task.file, task.options);
          break;
        case 'decrypt':
          result = await this.decryptFile(task.file, task.options);
          break;
        case 'hash':
          result = await this.hashFile(task.file, task.options);
          break;
        case 'chunk':
          result = await this.chunkFile(task.file, task.options);
          break;
        case 'analyze':
          result = await this.analyzeFile(task.file, task.options);
          break;
        default:
          throw new Error(`Unknown operation: ${task.operation}`);
      }

      this.postMessage({
        type: 'task_complete',
        taskId: task.id,
        result,
        processingTime: Date.now() - task.startTime
      });

      task.resolve(result);
    } catch (error) {
      this.postMessage({
        type: 'task_error',
        taskId: task.id,
        error: error.message,
        processingTime: Date.now() - task.startTime
      });

      task.reject(error);
    } finally {
      this.activeOperations.delete(task.id);
      this.processNextTask();
    }
  }

  processNextTask() {
    if (this.operationQueue.length > 0 && this.activeOperations.size < this.maxConcurrentOperations) {
      const nextTask = this.operationQueue.shift();
      this.executeTask(nextTask);
    }
  }

  async compressFile(file, options) {
    const { quality = 0.8, format = 'webp' } = options;
    
    if (file.type.startsWith('image/')) {
      return await this.compressImage(file, quality, format);
    } else {
      return await this.compressData(file, options);
    }
  }

  async compressImage(file, quality, format) {
    return new Promise((resolve) => {
      const canvas = new OffscreenCanvas(1, 1);
      const ctx = canvas.getContext('2d');
      
      const img = new Image();
      img.onload = () => {
        // Calculate optimal dimensions based on file size
        const maxWidth = file.size > 5000000 ? 1920 : file.size > 1000000 ? 1280 : 1024;
        const scale = Math.min(maxWidth / img.width, maxWidth / img.height, 1);
        
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        canvas.convertToBlob({
          type: `image/${format}`,
          quality: quality
        }).then(resolve);
      };
      
      img.src = URL.createObjectURL(file);
    });
  }

  async compressData(file, options) {
    // Simple data compression using built-in compression
    const { compressionLevel = 6 } = options;
    
    const arrayBuffer = await file.arrayBuffer();
    const compressed = await this.gzipCompress(arrayBuffer, compressionLevel);
    
    return new Blob([compressed], { type: 'application/gzip' });
  }

  async gzipCompress(data, level) {
    // Note: This is a simplified implementation
    // In a real application, you'd use a proper compression library
    const stream = new CompressionStream('gzip');
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();
    
    writer.write(data);
    writer.close();
    
    const chunks = [];
    let done = false;
    
    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value) chunks.push(value);
    }
    
    return new Uint8Array(chunks.reduce((acc, chunk) => [...acc, ...chunk], []));
  }

  async encryptFile(file, options) {
    const { key, algorithm = 'AES-GCM' } = options;
    
    const arrayBuffer = await file.arrayBuffer();
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(key),
      { name: algorithm },
      false,
      ['encrypt']
    );
    
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: algorithm, iv },
      cryptoKey,
      arrayBuffer
    );
    
    return {
      encrypted: new Uint8Array(encrypted),
      iv,
      algorithm
    };
  }

  async decryptFile(encryptedData, options) {
    const { key, iv, algorithm = 'AES-GCM' } = options;
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(key),
      { name: algorithm },
      false,
      ['decrypt']
    );
    
    const decrypted = await crypto.subtle.decrypt(
      { name: algorithm, iv },
      cryptoKey,
      encryptedData
    );
    
    return new Uint8Array(decrypted);
  }

  async hashFile(file, options) {
    const { algorithm = 'SHA-256' } = options;
    
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest(algorithm, arrayBuffer);
    
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  async chunkFile(file, options) {
    const { chunkSize = 1024 * 1024 } = options; // 1MB chunks by default
    
    const chunks = [];
    let offset = 0;
    
    while (offset < file.size) {
      const chunk = file.slice(offset, offset + chunkSize);
      const arrayBuffer = await chunk.arrayBuffer();
      
      chunks.push({
        index: chunks.length,
        data: new Uint8Array(arrayBuffer),
        size: chunk.size,
        offset
      });
      
      offset += chunkSize;
    }
    
    return chunks;
  }

  async analyzeFile(file, options) {
    const analysis = {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
      timestamp: Date.now()
    };

    // Analyze file content for additional metadata
    if (file.type.startsWith('image/')) {
      analysis.imageData = await this.analyzeImage(file);
    } else if (file.type.startsWith('text/')) {
      analysis.textData = await this.analyzeText(file);
    }

    return analysis;
  }

  async analyzeImage(file) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height,
          aspectRatio: img.width / img.height,
          megapixels: (img.width * img.height) / 1000000
        });
      };
      img.onerror = () => resolve(null);
      img.src = URL.createObjectURL(file);
    });
  }

  async analyzeText(file) {
    const text = await file.text();
    const lines = text.split('\n').length;
    const words = text.split(/\s+/).length;
    const characters = text.length;
    
    return {
      lines,
      words,
      characters,
      encoding: this.detectEncoding(text)
    };
  }

  detectEncoding(text) {
    // Simple encoding detection
    try {
      if (btoa(atob(text)) === text) return 'base64';
      return 'utf-8';
    } catch {
      return 'binary';
    }
  }

  postMessage(data) {
    if (typeof self !== 'undefined' && self.postMessage) {
      self.postMessage(data);
    }
  }
}

// Worker message handling
const processor = new FileProcessor();

self.onmessage = async (event) => {
  const { type, data, taskId } = event.data;
  
  try {
    switch (type) {
      case 'process_file':
        const result = await processor.processFile(data.file, data.operation, data.options);
        self.postMessage({
          type: 'result',
          taskId,
          result
        });
        break;
        
      case 'get_status':
        self.postMessage({
          type: 'status',
          taskId,
          activeOperations: processor.activeOperations.size,
          queuedOperations: processor.operationQueue.length,
          maxConcurrentOperations: processor.maxConcurrentOperations
        });
        break;
        
      default:
        self.postMessage({
          type: 'error',
          taskId,
          error: `Unknown message type: ${type}`
        });
    }
  } catch (error) {
    self.postMessage({
      type: 'error',
      taskId,
      error: error.message
    });
  }
};

// Export for use in main thread (if imported as module)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FileProcessor;
}