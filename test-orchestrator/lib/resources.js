/**
 * Resource Management - Intelligent Resource Pooling and Optimization
 *
 * Manages system resources during test execution including:
 * - Memory pools and limits
 * - CPU usage monitoring
 * - Database connection pooling
 * - HTTP client pooling
 * - Resource cleanup and optimization
 */

const EventEmitter = require('events');
const { performance } = require('perf_hooks');

class ResourcePool extends EventEmitter {
  constructor(maxResources) {
    super();
    this.maxResources = maxResources;
    this.allocatedResources = new Map();
    this.resourceLimits = this.initializeLimits();
    this.monitoring = new ResourceMonitoring();
    this.cleanup = new ResourceCleanup();

    this.startMonitoring();
  }

  /**
   * Initialize resource limits
   */
  initializeLimits() {
    return {
      memory: {
        max: 2048, // MB
        used: 0,
        threshold: 0.8
      },
      cpu: {
        max: 90, // %
        used: 0,
        threshold: 0.8
      },
      workers: {
        max: this.maxResources,
        used: 0,
        threshold: 0.9
      },
      connections: {
        database: { max: 10, used: 0 },
        http: { max: 20, used: 0 }
      }
    };
  }

  /**
   * Acquire resources for test execution
   */
  acquire(resourceRequest) {
    const requestId = this.generateRequestId();
    const requiredResources = this.calculateRequiredResources(resourceRequest);

    // Check if resources are available
    if (!this.areResourcesAvailable(requiredResources)) {
      this.emit('resource-unavailable', { requestId, requiredResources });
      return false;
    }

    // Allocate resources
    const allocation = this.allocateResources(requestId, requiredResources);

    this.emit('resource-acquired', { requestId, allocation });

    return allocation;
  }

  /**
   * Release allocated resources
   */
  release(allocation) {
    if (!allocation || !allocation.requestId) {
      return;
    }

    const { requestId } = allocation;

    if (!this.allocatedResources.has(requestId)) {
      return;
    }

    // Free allocated resources
    const freedResources = this.freeResources(requestId);

    this.emit('resource-released', { requestId, freedResources });

    // Trigger garbage collection if memory is high
    if (this.getResourceUsage().memory.ratio > 0.7) {
      this.triggerGarbageCollection();
    }
  }

  /**
   * Check if resources are available
   */
  areResourcesAvailable(requiredResources) {
    const usage = this.getResourceUsage();

    // Check memory availability
    if (usage.memory.available < requiredResources.memory) {
      return false;
    }

    // Check CPU availability
    if (usage.cpu.available < 100) { // CPU is not a hard limit
      return false;
    }

    // Check worker availability
    if (usage.workers.available < 1) {
      return false;
    }

    // Check connection availability
    if (requiredResources.connections) {
      for (const [type, required] of Object.entries(requiredResources.connections)) {
        if (usage.connections[type].available < required) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Calculate required resources for a request
   */
  calculateRequiredResources(resourceRequest) {
    const defaults = {
      memory: 256,
      timeout: 30000,
      connections: {}
    };

    return {
      memory: resourceRequest.memory || defaults.memory,
      timeout: resourceRequest.timeout || defaults.timeout,
      connections: {
        database: resourceRequest.database ? 1 : 0,
        http: resourceRequest.http ? 2 : 0,
        ...defaults.connections
      }
    };
  }

  /**
   * Allocate resources
   */
  allocateResources(requestId, requiredResources) {
    const allocation = {
      requestId,
      timestamp: performance.now(),
      resources: { ...requiredResources },
      cleanup: []
    };

    // Update resource usage
    this.resourceLimits.memory.used += requiredResources.memory;
    this.resourceLimits.workers.used += 1;

    if (requiredResources.connections) {
      for (const [type, count] of Object.entries(requiredResources.connections)) {
        if (this.resourceLimits.connections[type]) {
          this.resourceLimits.connections[type].used += count;
        }
      }
    }

    // Store allocation
    this.allocatedResources.set(requestId, allocation);

    return allocation;
  }

  /**
   * Free allocated resources
   */
  freeResources(requestId) {
    const allocation = this.allocatedResources.get(requestId);
    if (!allocation) {
      return {};
    }

    const { resources } = allocation;

    // Update resource usage
    this.resourceLimits.memory.used -= resources.memory;
    this.resourceLimits.workers.used -= 1;

    if (resources.connections) {
      for (const [type, count] of Object.entries(resources.connections)) {
        if (this.resourceLimits.connections[type]) {
          this.resourceLimits.connections[type].used -= count;
        }
      }
    }

    // Remove allocation
    this.allocatedResources.delete(requestId);

    // Run cleanup
    allocation.cleanup.forEach(cleanup => {
      try {
        cleanup();
      } catch (error) {
        this.emit('cleanup-error', { error, requestId });
      }
    });

    return resources;
  }

  /**
   * Get current resource usage
   */
  getResourceUsage() {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      memory: {
        used: this.resourceLimits.memory.used,
        max: this.resourceLimits.memory.max,
        available: this.resourceLimits.memory.max - this.resourceLimits.memory.used,
        ratio: this.resourceLimits.memory.used / this.resourceLimits.memory.max,
        actual: {
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          external: Math.round(memoryUsage.external / 1024 / 1024),
          rss: Math.round(memoryUsage.rss / 1024 / 1024)
        }
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
        available: Math.max(0, 100 - this.resourceLimits.cpu.used)
      },
      workers: {
        used: this.resourceLimits.workers.used,
        max: this.resourceLimits.workers.max,
        available: this.resourceLimits.workers.max - this.resourceLimits.workers.used,
        ratio: this.resourceLimits.workers.used / this.resourceLimits.workers.max
      },
      connections: Object.entries(this.resourceLimits.connections).reduce((acc, [type, config]) => {
        acc[type] = {
          used: config.used,
          max: config.max,
          available: config.max - config.used
        };
        return acc;
      }, {})
    };
  }

  /**
   * Start resource monitoring
   */
  startMonitoring() {
    this.monitoring.start();
    this.monitoring.on('metrics', (metrics) => {
      this.emit('metrics', metrics);

      // Check for resource warnings
      this.checkResourceWarnings(metrics);
    });
  }

  /**
   * Check for resource warnings
   */
  checkResourceWarnings(metrics) {
    // Memory warnings
    if (metrics.memory.ratio > this.resourceLimits.memory.threshold) {
      this.emit('resource-warning', {
        type: 'memory',
        usage: metrics.memory.ratio,
        threshold: this.resourceLimits.memory.threshold
      });
    }

    // Worker warnings
    if (metrics.workers.ratio > this.resourceLimits.workers.threshold) {
      this.emit('resource-warning', {
        type: 'workers',
        usage: metrics.workers.ratio,
        threshold: this.resourceLimits.workers.threshold
      });
    }

    // Connection warnings
    Object.entries(metrics.connections).forEach(([type, usage]) => {
      const config = this.resourceLimits.connections[type];
      if (config && usage.used / config.max > 0.8) {
        this.emit('resource-warning', {
          type: 'connections',
          connectionType: type,
          usage: usage.used / config.max
        });
      }
    });
  }

  /**
   * Trigger garbage collection
   */
  triggerGarbageCollection() {
    if (global.gc) {
      global.gc();
      this.emit('garbage-collection');
    }
  }

  /**
   * Generate unique request ID
   */
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get utilization statistics
   */
  getUtilization() {
    const usage = this.getResourceUsage();

    return {
      memory: usage.memory.ratio,
      workers: usage.workers.ratio,
      connections: Object.values(usage.connections).reduce((sum, conn) =>
        sum + (conn.used / conn.max), 0) / Object.keys(usage.connections).length
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    console.log('🛑 Shutting down resource pool...');

    // Stop monitoring
    this.monitoring.stop();

    // Release all allocations
    const allocations = Array.from(this.allocatedResources.keys());
    for (const requestId of allocations) {
      this.release({ requestId });
    }

    // Run cleanup
    await this.cleanup.cleanupAll();

    console.log('✅ Resource pool shutdown complete');
  }
}

/**
 * Resource Monitoring
 */
class ResourceMonitoring extends EventEmitter {
  constructor() {
    super();
    this.interval = null;
    this.metricsHistory = [];
    this.maxHistorySize = 100;
  }

  start(intervalMs = 1000) {
    this.interval = setInterval(() => {
      const metrics = this.collectMetrics();
      this.metricsHistory.push(metrics);

      // Keep history size bounded
      if (this.metricsHistory.length > this.maxHistorySize) {
        this.metricsHistory.shift();
      }

      this.emit('metrics', metrics);
    }, intervalMs);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  collectMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    const now = performance.now();

    return {
      timestamp: now,
      memory: {
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external,
        rss: memUsage.rss
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      uptime: process.uptime(),
      activeHandles: process._getActiveHandles().length,
      activeRequests: process._getActiveRequests().length
    };
  }

  getAverageMetrics(count = 10) {
    const recent = this.metricsHistory.slice(-count);
    if (recent.length === 0) return null;

    const avg = recent.reduce((acc, metrics) => {
      acc.memory.heapUsed += metrics.memory.heapUsed;
      acc.memory.heapTotal += metrics.memory.heapTotal;
      acc.memory.external += metrics.memory.external;
      acc.cpu.user += metrics.cpu.user;
      acc.cpu.system += metrics.cpu.system;
      return acc;
    }, {
      memory: { heapUsed: 0, heapTotal: 0, external: 0 },
      cpu: { user: 0, system: 0 }
    });

    const factor = 1 / recent.length;
    return {
      memory: {
        heapUsed: avg.memory.heapUsed * factor,
        heapTotal: avg.memory.heapTotal * factor,
        external: avg.memory.external * factor
      },
      cpu: {
        user: avg.cpu.user * factor,
        system: avg.cpu.system * factor
      }
    };
  }
}

/**
 * Resource Cleanup
 */
class ResourceCleanup {
  constructor() {
    this.cleanupTasks = new Set();
  }

  addCleanupTask(task) {
    this.cleanupTasks.add(task);
  }

  removeCleanupTask(task) {
    this.cleanupTasks.delete(task);
  }

  async cleanupAll() {
    console.log('🧹 Running resource cleanup...');

    const cleanupPromises = Array.from(this.cleanupTasks).map(async task => {
      try {
        await task();
      } catch (error) {
        console.warn('Cleanup task failed:', error.message);
      }
    });

    await Promise.allSettled(cleanupPromises);
    this.cleanupTasks.clear();

    console.log('✅ Resource cleanup complete');
  }
}

/**
 * Database Connection Pool
 */
class DatabasePool {
  constructor(config = {}) {
    this.config = {
      min: 2,
      max: 10,
      idleTimeoutMillis: 30000,
      acquireTimeoutMillis: 5000,
      ...config
    };

    this.pool = null;
    this.activeConnections = 0;
    this.totalConnections = 0;
  }

  async initialize() {
    // This would integrate with your actual database pool
    // For now, we'll simulate pool behavior
    console.log('🗄️  Initializing database connection pool...');

    this.pool = {
      connections: [],
      waiting: []
    };
  }

  async acquire() {
    return new Promise((resolve, reject) => {
      // Check for available connection
      const availableConnection = this.pool.connections.find(conn => !conn.inUse);

      if (availableConnection) {
        availableConnection.inUse = true;
        this.activeConnections++;
        resolve(availableConnection);
      } else if (this.activeConnections < this.config.max) {
        // Create new connection
        const connection = this.createConnection();
        connection.inUse = true;
        this.pool.connections.push(connection);
        this.activeConnections++;
        this.totalConnections++;
        resolve(connection);
      } else {
        // Wait for available connection
        this.pool.waiting.push({ resolve, reject });

        // Timeout
        setTimeout(() => {
          const waitingIndex = this.pool.waiting.findIndex(w => w.resolve === resolve);
          if (waitingIndex !== -1) {
            this.pool.waiting.splice(waitingIndex, 1);
            reject(new Error('Database connection timeout'));
          }
        }, this.config.acquireTimeoutMillis);
      }
    });
  }

  release(connection) {
    connection.inUse = false;
    this.activeConnections--;

    // Check if someone is waiting
    if (this.pool.waiting.length > 0) {
      const waiting = this.pool.waiting.shift();
      connection.inUse = true;
      this.activeConnections++;
      waiting.resolve(connection);
    }
  }

  createConnection() {
    // Simulate connection creation
    return {
      id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      inUse: false,
      createdAt: performance.now(),
      query: async (sql, params) => {
        // Simulate query execution
        await new Promise(resolve => setTimeout(resolve, 10));
        return { rows: [], rowCount: 0 };
      }
    };
  }

  async close() {
    console.log('🗄️  Closing database pool...');

    // Close all connections
    for (const connection of this.pool.connections) {
      await connection.close?.();
    }

    this.pool = null;
    this.activeConnections = 0;
  }

  getStats() {
    return {
      active: this.activeConnections,
      total: this.totalConnections,
      waiting: this.pool?.waiting.length || 0,
      config: this.config
    };
  }
}

module.exports = {
  ResourcePool,
  ResourceMonitoring,
  ResourceCleanup,
  DatabasePool
};