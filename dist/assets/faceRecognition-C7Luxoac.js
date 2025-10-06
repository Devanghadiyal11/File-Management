// faceRecognition.js - Web Worker for face recognition operations
// Handles face detection, descriptor generation, and matching

class FaceRecognitionWorker {
  constructor() {
    this.faceapi = null;
    this.modelsLoaded = false;
    this.loadingPromise = null;
    this.maxConcurrentOperations = Math.min(__CPU_CORES__ || 2, 4);
    this.activeOperations = new Map();
    this.operationQueue = [];
  }

  async loadModels() {
    if (this.modelsLoaded) return;
    if (this.loadingPromise) return this.loadingPromise;

    this.loadingPromise = this.doLoadModels();
    await this.loadingPromise;
    this.modelsLoaded = true;
  }

  async doLoadModels() {
    // Import face-api.js in worker context
    try {
      // Try to import face-api.js
      if (typeof importScripts !== 'undefined') {
        importScripts('https://unpkg.com/face-api.js@0.22.2/dist/face-api.min.js');
        this.faceapi = faceapi;
      } else {
        // For modern browsers with module support
        const faceApiModule = await import('face-api.js');
        this.faceapi = faceApiModule;
      }

      // Load models with fallback URLs
      const bases = [
        '/models',
        'https://justadudewhohacks.github.io/face-api.js/models',
        'https://unpkg.com/face-api.js@0.22.2/weights',
        'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights',
      ];

      let lastErr = null;
      for (const base of bases) {
        try {
          await Promise.all([
            this.faceapi.nets.tinyFaceDetector.loadFromUri(base),
            this.faceapi.nets.faceRecognitionNet.loadFromUri(base),
            this.faceapi.nets.faceLandmark68Net.loadFromUri(base)
          ]);
          
          this.postMessage({ type: 'models_loaded', source: base });
          return; // success
        } catch (e) {
          lastErr = e;
          // try next base
        }
      }
      throw lastErr || new Error('Failed to load face-api models from all sources');
    } catch (error) {
      this.postMessage({ type: 'models_error', error: error.message });
      throw error;
    }
  }

  async processRequest(operation, data, options = {}) {
    const operationId = `${operation}_${Date.now()}_${Math.random()}`;
    
    return new Promise((resolve, reject) => {
      const task = {
        id: operationId,
        operation,
        data,
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
      await this.loadModels();
      
      let result;
      
      switch (task.operation) {
        case 'detect_faces':
          result = await this.detectFaces(task.data, task.options);
          break;
        case 'generate_descriptor':
          result = await this.generateDescriptor(task.data, task.options);
          break;
        case 'match_faces':
          result = await this.matchFaces(task.data, task.options);
          break;
        case 'validate_face':
          result = await this.validateFace(task.data, task.options);
          break;
        case 'extract_features':
          result = await this.extractFeatures(task.data, task.options);
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

  async detectFaces(imageData, options = {}) {
    const { minConfidence = 0.5, inputSize = 512 } = options;
    
    // Create image from data
    const img = await this.createImageFromData(imageData);
    
    // Detect faces
    const detections = await this.faceapi
      .detectAllFaces(img, new this.faceapi.TinyFaceDetectorOptions({ 
        inputSize, 
        scoreThreshold: minConfidence 
      }))
      .withFaceLandmarks()
      .withFaceDescriptors();

    return detections.map(detection => ({
      box: detection.detection.box,
      landmarks: detection.landmarks.positions,
      descriptor: Array.from(detection.descriptor),
      confidence: detection.detection.score
    }));
  }

  async generateDescriptor(imageData, options = {}) {
    const faces = await this.detectFaces(imageData, options);
    
    if (faces.length === 0) {
      throw new Error('No faces detected in image');
    }
    
    if (faces.length > 1) {
      // Return the face with highest confidence
      const bestFace = faces.reduce((best, current) => 
        current.confidence > best.confidence ? current : best
      );
      return bestFace.descriptor;
    }
    
    return faces[0].descriptor;
  }

  async matchFaces(data, options = {}) {
    const { targetDescriptor, candidateDescriptors, threshold = 0.6 } = data;
    const { returnBestMatch = true } = options;
    
    if (!targetDescriptor || !candidateDescriptors) {
      throw new Error('Target descriptor and candidate descriptors are required');
    }

    const target = new Float32Array(targetDescriptor);
    const matches = candidateDescriptors.map((candidate, index) => {
      const candidateFloat32 = new Float32Array(candidate.descriptor || candidate);
      const distance = this.calculateEuclideanDistance(target, candidateFloat32);
      
      return {
        index,
        distance,
        confidence: Math.max(0, 1 - distance),
        isMatch: distance < threshold,
        candidateId: candidate.id || index
      };
    });

    // Sort by confidence (lowest distance = highest confidence)
    matches.sort((a, b) => a.distance - b.distance);
    
    if (returnBestMatch) {
      return matches[0];
    }
    
    return matches.filter(match => match.isMatch);
  }

  calculateEuclideanDistance(desc1, desc2) {
    if (desc1.length !== desc2.length) {
      throw new Error('Descriptor dimensions do not match');
    }
    
    let sum = 0;
    for (let i = 0; i < desc1.length; i++) {
      const diff = desc1[i] - desc2[i];
      sum += diff * diff;
    }
    return Math.sqrt(sum);
  }

  async validateFace(imageData, options = {}) {
    const { quality = true, expression = false, pose = false } = options;
    
    const faces = await this.detectFaces(imageData, { minConfidence: 0.3 });
    
    if (faces.length === 0) {
      return { valid: false, reason: 'No face detected' };
    }
    
    if (faces.length > 1) {
      return { valid: false, reason: 'Multiple faces detected' };
    }
    
    const face = faces[0];
    const validation = {
      valid: true,
      confidence: face.confidence,
      quality: { score: face.confidence, acceptable: face.confidence > 0.7 }
    };
    
    if (quality && face.confidence < 0.7) {
      validation.valid = false;
      validation.reason = 'Face quality too low';
    }
    
    // Additional validation based on landmarks
    if (face.landmarks) {
      const faceSize = Math.max(face.box.width, face.box.height);
      validation.faceSize = faceSize;
      
      if (faceSize < 100) {
        validation.valid = false;
        validation.reason = 'Face too small';
      }
    }
    
    return validation;
  }

  async extractFeatures(imageData, options = {}) {
    const faces = await this.detectFaces(imageData, options);
    
    return faces.map(face => ({
      descriptor: face.descriptor,
      landmarks: face.landmarks,
      boundingBox: face.box,
      confidence: face.confidence,
      features: {
        eyeDistance: this.calculateEyeDistance(face.landmarks),
        faceWidth: face.box.width,
        faceHeight: face.box.height,
        aspectRatio: face.box.width / face.box.height
      }
    }));
  }

  calculateEyeDistance(landmarks) {
    if (!landmarks || landmarks.length < 36) return null;
    
    // Approximate eye centers (landmarks 36 and 45)
    const leftEye = landmarks[36];
    const rightEye = landmarks[45];
    
    if (!leftEye || !rightEye) return null;
    
    const dx = rightEye.x - leftEye.x;
    const dy = rightEye.y - leftEye.y;
    
    return Math.sqrt(dx * dx + dy * dy);
  }

  async createImageFromData(imageData) {
    if (imageData instanceof ImageData) {
      // Create canvas from ImageData
      const canvas = new OffscreenCanvas(imageData.width, imageData.height);
      const ctx = canvas.getContext('2d');
      ctx.putImageData(imageData, 0, 0);
      return canvas;
    }
    
    if (imageData instanceof Blob) {
      // Create image from blob
      const bitmap = await createImageBitmap(imageData);
      return bitmap;
    }
    
    if (typeof imageData === 'string') {
      // Assume base64 data URL
      const bitmap = await createImageBitmap(await fetch(imageData).then(r => r.blob()));
      return bitmap;
    }
    
    throw new Error('Unsupported image data format');
  }

  postMessage(data) {
    if (typeof self !== 'undefined' && self.postMessage) {
      self.postMessage(data);
    }
  }
}

// Worker message handling
const faceWorker = new FaceRecognitionWorker();

self.onmessage = async (event) => {
  const { type, data, options, taskId } = event.data;
  
  try {
    switch (type) {
      case 'init':
        await faceWorker.loadModels();
        self.postMessage({
          type: 'initialized',
          taskId
        });
        break;
        
      case 'detect_faces':
      case 'generate_descriptor':
      case 'match_faces':
      case 'validate_face':
      case 'extract_features':
        const result = await faceWorker.processRequest(type, data, options);
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
          modelsLoaded: faceWorker.modelsLoaded,
          activeOperations: faceWorker.activeOperations.size,
          queuedOperations: faceWorker.operationQueue.length,
          maxConcurrentOperations: faceWorker.maxConcurrentOperations
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
  module.exports = FaceRecognitionWorker;
}