// WorkerManager.js - Centralized manager for Web Workers
// Handles worker lifecycle, task distribution, and performance monitoring

class WorkerManager {
  constructor() {
    this.workers = new Map();
    this.workerPools = new Map();
    this.taskQueue = new Map();
    this.activeJobs = new Map();
    this.workerStats = new Map();
    this.cpuCores = navigator.hardwareConcurrency || 4;
    
    // Initialize worker configurations
    this.workerConfigs = {
      fileProcessor: {
        script: new URL('../workers/fileProcessor.js', import.meta.url),
        poolSize: Math.min(this.cpuCores, 4),
        maxRetries: 3,
        timeout: 30000
      }
    };

    this.initialized = false;
    this.initPromise = null;
  }

  async initialize() {
    if (this.initialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this.doInitialize();
    await this.initPromise;
    this.initialized = true;
  }

  async doInitialize() {
    console.log(`🔧 Initializing WorkerManager with ${this.cpuCores} CPU cores`);
    
    // Create worker pools
    for (const [workerType, config] of Object.entries(this.workerConfigs)) {
      await this.createWorkerPool(workerType, config);
    }

    // Set up performance monitoring
    this.startPerformanceMonitoring();
    
    console.log('✅ WorkerManager initialized successfully');
  }

  async createWorkerPool(workerType, config) {
    const pool = [];
    const stats = {
      created: Date.now(),
      tasksCompleted: 0,
      tasksErrored: 0,
      totalProcessingTime: 0,
      averageProcessingTime: 0,
      activeWorkers: 0
    };

    for (let i = 0; i < config.poolSize; i++) {
      try {
        const worker = new Worker(config.script, { 
          type: 'module',
          name: `${workerType}-${i}`
        });

        const workerInfo = {
          id: `${workerType}-${i}`,
          worker,
          busy: false,
          tasksProcessed: 0,
          errors: 0,
          created: Date.now(),
          lastUsed: null
        };

        // Set up worker message handling
        this.setupWorkerHandlers(workerInfo, workerType);
        
        pool.push(workerInfo);
        console.log(`🏗️  Created worker: ${workerInfo.id}`);
      } catch (error) {
        console.error(`❌ Failed to create worker ${workerType}-${i}:`, error);
      }
    }

    this.workerPools.set(workerType, pool);
    this.workerStats.set(workerType, stats);
    this.taskQueue.set(workerType, []);
  }

  setupWorkerHandlers(workerInfo, workerType) {
    const { worker, id } = workerInfo;

    worker.addEventListener('message', (event) => {
      const { type, taskId, result, error, processingTime } = event.data;
      
      switch (type) {
        case 'result':
        case 'task_complete':
          this.handleTaskComplete(id, workerType, taskId, result, processingTime);
          break;
          
        case 'error':
        case 'task_error':
          this.handleTaskError(id, workerType, taskId, error, processingTime);
          break;
          
        case 'models_loaded':
        case 'initialized':
          console.log(`✅ Worker ${id} initialized successfully`);
          break;
          
        case 'models_error':
          console.error(`❌ Worker ${id} failed to load models:`, error);
          break;
          
        default:
          console.log(`📥 Worker ${id} message:`, event.data);
      }
    });

    worker.addEventListener('error', (error) => {
      console.error(`❌ Worker ${id} error:`, error);
      this.handleWorkerError(workerInfo, workerType, error);
    });

    worker.addEventListener('messageerror', (error) => {
      console.error(`📨 Worker ${id} message error:`, error);
    });
  }

  async executeTask(workerType, operation, data, options = {}) {
    await this.initialize();

    const taskId = `${workerType}_${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timeout = options.timeout || this.workerConfigs[workerType]?.timeout || 30000;

    return new Promise((resolve, reject) => {
      const job = {
        taskId,
        workerType,
        operation,
        data,
        options,
        resolve,
        reject,
        created: Date.now(),
        retries: 0,
        maxRetries: this.workerConfigs[workerType]?.maxRetries || 3
      };

      // Set timeout
      job.timeoutId = setTimeout(() => {
        this.handleTaskTimeout(job);
      }, timeout);

      this.activeJobs.set(taskId, job);
      
      // Try to assign to available worker
      const assigned = this.tryAssignTask(job);
      
      if (!assigned) {
        // Add to queue
        const queue = this.taskQueue.get(workerType) || [];
        queue.push(job);
        console.log(`📋 Task ${taskId} queued (${queue.length} in queue)`);
      }
    });
  }

  tryAssignTask(job) {
    const pool = this.workerPools.get(job.workerType);
    if (!pool) return false;

    // Find available worker
    const availableWorker = pool.find(w => !w.busy);
    if (!availableWorker) return false;

    this.assignTaskToWorker(job, availableWorker);
    return true;
  }

  assignTaskToWorker(job, workerInfo) {
    workerInfo.busy = true;
    workerInfo.lastUsed = Date.now();
    workerInfo.currentTask = job.taskId;

    const message = {
      type: job.operation,
      data: job.data,
      options: job.options,
      taskId: job.taskId
    };

    console.log(`🚀 Assigning task ${job.taskId} to worker ${workerInfo.id}`);
    workerInfo.worker.postMessage(message);
  }

  handleTaskComplete(workerId, workerType, taskId, result, processingTime) {
    const job = this.activeJobs.get(taskId);
    if (!job) return;

    // Clear timeout
    if (job.timeoutId) {
      clearTimeout(job.timeoutId);
    }

    // Update statistics
    this.updateWorkerStats(workerType, workerId, processingTime, false);

    // Mark worker as available
    this.markWorkerAvailable(workerType, workerId);

    // Resolve the job
    job.resolve(result);
    this.activeJobs.delete(taskId);

    console.log(`✅ Task ${taskId} completed in ${processingTime}ms by ${workerId}`);

    // Process next task in queue
    this.processNextTask(workerType);
  }

  handleTaskError(workerId, workerType, taskId, error, processingTime) {
    const job = this.activeJobs.get(taskId);
    if (!job) return;

    console.error(`❌ Task ${taskId} failed on ${workerId}:`, error);

    // Update statistics
    this.updateWorkerStats(workerType, workerId, processingTime, true);

    // Mark worker as available
    this.markWorkerAvailable(workerType, workerId);

    // Retry logic
    if (job.retries < job.maxRetries) {
      job.retries++;
      console.log(`🔄 Retrying task ${taskId} (attempt ${job.retries}/${job.maxRetries})`);
      
      const assigned = this.tryAssignTask(job);
      if (!assigned) {
        const queue = this.taskQueue.get(workerType) || [];
        queue.unshift(job); // Add to front of queue for retry
      }
      return;
    }

    // Clear timeout
    if (job.timeoutId) {
      clearTimeout(job.timeoutId);
    }

    // Reject the job after max retries
    job.reject(new Error(`Task failed after ${job.maxRetries} retries: ${error}`));
    this.activeJobs.delete(taskId);

    // Process next task in queue
    this.processNextTask(workerType);
  }

  handleTaskTimeout(job) {
    console.warn(`⏰ Task ${job.taskId} timed out`);
    
    // Mark worker as available (it might be stuck)
    const pool = this.workerPools.get(job.workerType);
    if (pool) {
      const worker = pool.find(w => w.currentTask === job.taskId);
      if (worker) {
        this.markWorkerAvailable(job.workerType, worker.id);
      }
    }

    // Retry or reject
    if (job.retries < job.maxRetries) {
      job.retries++;
      const assigned = this.tryAssignTask(job);
      if (!assigned) {
        const queue = this.taskQueue.get(job.workerType) || [];
        queue.unshift(job);
      }
    } else {
      job.reject(new Error(`Task timed out after ${job.maxRetries} retries`));
      this.activeJobs.delete(job.taskId);
    }
  }

  markWorkerAvailable(workerType, workerId) {
    const pool = this.workerPools.get(workerType);
    if (!pool) return;

    const worker = pool.find(w => w.id === workerId);
    if (worker) {
      worker.busy = false;
      worker.currentTask = null;
    }
  }

  processNextTask(workerType) {
    const queue = this.taskQueue.get(workerType);
    if (!queue || queue.length === 0) return;

    const nextJob = queue.shift();
    const assigned = this.tryAssignTask(nextJob);
    
    if (!assigned) {
      // Put back in queue
      queue.unshift(nextJob);
    }
  }

  updateWorkerStats(workerType, workerId, processingTime, isError) {
    const stats = this.workerStats.get(workerType);
    const pool = this.workerPools.get(workerType);
    
    if (stats && pool) {
      if (isError) {
        stats.tasksErrored++;
      } else {
        stats.tasksCompleted++;
        stats.totalProcessingTime += processingTime || 0;
        stats.averageProcessingTime = stats.totalProcessingTime / stats.tasksCompleted;
      }

      const worker = pool.find(w => w.id === workerId);
      if (worker) {
        if (isError) {
          worker.errors++;
        } else {
          worker.tasksProcessed++;
        }
      }
    }
  }

  handleWorkerError(workerInfo, workerType, error) {
    console.error(`💥 Worker ${workerInfo.id} crashed:`, error);
    
    // Try to recreate the worker
    this.recreateWorker(workerInfo, workerType);
  }

  async recreateWorker(oldWorkerInfo, workerType) {
    const config = this.workerConfigs[workerType];
    const pool = this.workerPools.get(workerType);
    
    if (!config || !pool) return;

    try {
      // Terminate old worker
      oldWorkerInfo.worker.terminate();

      // Create new worker
      const worker = new Worker(config.script, { 
        type: 'module',
        name: oldWorkerInfo.id
      });

      const newWorkerInfo = {
        ...oldWorkerInfo,
        worker,
        busy: false,
        currentTask: null,
        created: Date.now()
      };

      this.setupWorkerHandlers(newWorkerInfo, workerType);

      // Replace in pool
      const index = pool.findIndex(w => w.id === oldWorkerInfo.id);
      if (index !== -1) {
        pool[index] = newWorkerInfo;
      }

      console.log(`🔄 Recreated worker: ${oldWorkerInfo.id}`);
    } catch (error) {
      console.error(`❌ Failed to recreate worker ${oldWorkerInfo.id}:`, error);
    }
  }

  startPerformanceMonitoring() {
    // Monitor worker performance every 30 seconds
    setInterval(() => {
      this.logPerformanceStats();
    }, 30000);
  }

  logPerformanceStats() {
    console.log('📊 Worker Performance Stats:');
    
    for (const [workerType, stats] of this.workerStats.entries()) {
      const pool = this.workerPools.get(workerType);
      const activeWorkers = pool ? pool.filter(w => w.busy).length : 0;
      const queueLength = this.taskQueue.get(workerType)?.length || 0;
      
      console.log(`  ${workerType}:`, {
        completed: stats.tasksCompleted,
        errored: stats.tasksErrored,
        avgTime: Math.round(stats.averageProcessingTime),
        activeWorkers,
        queueLength,
        successRate: `${Math.round((stats.tasksCompleted / (stats.tasksCompleted + stats.tasksErrored) * 100) || 0)}%`
      });
    }
  }

  getStats() {
    const stats = {};
    
    for (const [workerType, workerStats] of this.workerStats.entries()) {
      const pool = this.workerPools.get(workerType);
      const activeWorkers = pool ? pool.filter(w => w.busy).length : 0;
      const queueLength = this.taskQueue.get(workerType)?.length || 0;
      
      stats[workerType] = {
        ...workerStats,
        activeWorkers,
        queueLength,
        totalWorkers: pool?.length || 0,
        successRate: (workerStats.tasksCompleted / (workerStats.tasksCompleted + workerStats.tasksErrored)) || 0
      };
    }
    
    return stats;
  }

  // Convenience methods for specific worker types
  async processFile(operation, file, options) {
    return this.executeTask('fileProcessor', 'process_file', { file, operation, options }, options);
  }


  // Cleanup method
  destroy() {
    console.log('🧹 Cleaning up WorkerManager...');
    
    // Clear all timeouts
    for (const job of this.activeJobs.values()) {
      if (job.timeoutId) {
        clearTimeout(job.timeoutId);
      }
    }

    // Terminate all workers
    for (const pool of this.workerPools.values()) {
      for (const workerInfo of pool) {
        workerInfo.worker.terminate();
      }
    }

    // Clear all data structures
    this.workers.clear();
    this.workerPools.clear();
    this.taskQueue.clear();
    this.activeJobs.clear();
    this.workerStats.clear();
    
    this.initialized = false;
    console.log('✅ WorkerManager cleaned up');
  }
}

// Create singleton instance
const workerManager = new WorkerManager();

export default workerManager;