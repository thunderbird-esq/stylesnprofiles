/**
 * NASA System 6 Portal - Test Orchestrator Configuration
 *
 * Centralized configuration for intelligent test orchestration
 * including execution strategies, resource management, and reporting
 */

module.exports = {
  // Test discovery patterns and directories
  discovery: {
    testDirectories: [
      'client/src/__tests__',
      'client/src/components/**/__tests__',
      'client/src/apps/**/__tests__',
      'client/src/system6/**/__tests__',
      'client/src/__integration__',
      'server/__tests__',
      'server/routes/__tests__'
    ],

    filePatterns: {
      unit: [
        '**/*.test.js',
        '!**/*.integration.test.js',
        '!**/*.e2e.test.js'
      ],
      integration: [
        '**/*.integration.test.js',
        '**/api/*.test.js'
      ],
      e2e: [
        '**/*.e2e.test.js',
        '**/*.spec.js'
      ]
    },

    excludePatterns: [
      '**/node_modules/**',
      '**/coverage/**',
      '**/dist/**',
      '**/build/**',
      '**/.cache/**'
    ]
  },

  // Test classification rules
  classification: {
    rules: {
      unit: {
        indicators: ['test(', 'it(', 'describe(', 'expect('],
        patterns: ['**/*.test.js'],
        priority: 1,
        isolation: true
      },
      integration: {
        indicators: ['req.', 'res.', 'app.', 'supertest', 'axios'],
        patterns: ['**/*.integration.test.js', '**/api/*.test.js'],
        priority: 2,
        isolation: false
      },
      e2e: {
        indicators: ['cy.', 'page.', 'browser', 'playwright'],
        patterns: ['**/*.e2e.test.js', '**/*.spec.js'],
        priority: 3,
        isolation: true
      },
      api: {
        indicators: ['express', 'router', 'apiProxy'],
        patterns: ['**/*api*.test.js'],
        priority: 2,
        isolation: true
      },
      database: {
        indicators: ['postgres', 'pool', 'sql', 'db.'],
        patterns: ['**/*db*.test.js'],
        priority: 2,
        isolation: true
      },
      performance: {
        indicators: ['performance', 'benchmark', 'lighthouse'],
        patterns: ['**/*perf*.test.js'],
        priority: 4,
        isolation: true
      }
    }
  },

  // Parallel execution configuration
  parallel: {
    enabled: true,
    global: {
      maxWorkers: 'auto', // auto = CPU count
      memoryLimit: 2048, // MB
      timeout: 30000 // ms
    },

    byType: {
      unit: {
        maxWorkers: 4,
        batchSize: 10,
        memoryPerWorker: 256,
        timeout: 10000
      },
      integration: {
        maxWorkers: 2,
        batchSize: 5,
        memoryPerWorker: 512,
        timeout: 60000
      },
      e2e: {
        maxWorkers: 1,
        batchSize: 1,
        memoryPerWorker: 1024,
        timeout: 180000
      },
      api: {
        maxWorkers: 2,
        batchSize: 3,
        memoryPerWorker: 256,
        timeout: 45000
      },
      database: {
        maxWorkers: 1,
        batchSize: 1,
        memoryPerWorker: 384,
        timeout: 90000
      },
      performance: {
        maxWorkers: 1,
        batchSize: 1,
        memoryPerWorker: 1024,
        timeout: 600000
      }
    }
  },

  // Resource management
  resources: {
    pools: {
      database: {
        maxConnections: 5,
        idleTimeout: 30000,
        acquireTimeout: 5000
      },
      http: {
        maxConcurrent: 10,
        timeout: 30000,
        retries: 3
      },
      memory: {
        maxHeapSize: 2048, // MB
        gcThreshold: 0.8,
        monitoringInterval: 5000
      }
    },

    limits: {
      maxMemoryUsage: 3072, // MB
      maxCpuUsage: 90, // %
      maxDiskSpace: 1024, // MB for test artifacts
      maxNetworkRequests: 50 // per minute
    },

    cleanup: {
      enabled: true,
      intervals: {
        tempFiles: 300000, // 5 minutes
        memory: 60000, // 1 minute
        connections: 30000 // 30 seconds
      }
    }
  },

  // Execution strategies
  execution: {
    strategies: {
      fastFeedback: {
        description: 'Run unit tests first for quick feedback',
        phases: [
          { type: 'unit', continueOnFailure: false },
          { type: 'integration', continueOnFailure: true },
          { type: 'e2e', continueOnFailure: true }
        ]
      },
      comprehensive: {
        description: 'Run all tests with full validation',
        phases: [
          { type: 'database', continueOnFailure: false },
          { type: 'api', continueOnFailure: false },
          { type: 'unit', continueOnFailure: false },
          { type: 'integration', continueOnFailure: true },
          { type: 'e2e', continueOnFailure: true }
        ]
      },
      smokeTest: {
        description: 'Run critical tests only',
        phases: [
          {
            type: 'unit',
            filters: ['critical', 'core'],
            continueOnFailure: false
          },
          {
            type: 'integration',
            filters: ['api'],
            continueOnFailure: true
          }
        ]
      },
      performance: {
        description: 'Run performance-focused tests',
        phases: [
          { type: 'unit', continueOnFailure: true },
          { type: 'performance', continueOnFailure: false }
        ]
      }
    },

    defaults: {
      strategy: 'fastFeedback',
      retries: 1,
      retryDelay: 1000,
      bailOnFailure: false,
      coverage: true,
      notifications: true
    }
  },

  // Dependencies and ordering
  dependencies: {
    rules: [
      {
        condition: 'requiresDatabase',
        dependencies: ['database-setup'],
        phase: 'before'
      },
      {
        condition: 'requiresAPI',
        dependencies: ['api-server'],
        phase: 'before'
      },
      {
        condition: 'isE2E',
        dependencies: ['unit', 'integration'],
        phase: 'after'
      }
    ],

    setupTests: [
      {
        name: 'database-setup',
        files: ['server/__tests__/db.test.js'],
        type: 'database'
      },
      {
        name: 'api-server',
        files: ['server/__tests__/server.test.js'],
        type: 'api'
      }
    ]
  },

  // Performance thresholds
  thresholds: {
    test: {
      maxDuration: 30000, // 30 seconds
      maxMemoryUsage: 256, // MB per test
      maxCpuUsage: 80, // %
      maxRetries: 3
    },
    suite: {
      maxDuration: 300000, // 5 minutes
      maxMemoryUsage: 2048, // MB
      maxFailures: 5, // Stop after N failures
      coverageThreshold: 80 // %
    },
    ci: {
      maxTotalDuration: 900000, // 15 minutes
      maxArtifactsSize: 100, // MB
      maxParallelJobs: 10
    }
  },

  // Monitoring and metrics
  monitoring: {
    enabled: true,
    metrics: {
      duration: true,
      memoryUsage: true,
      cpuUsage: true,
      networkRequests: true,
      cacheHitRate: true,
      retryCount: true
    },

    alerts: {
      slowTest: { threshold: 10000, enabled: true },
      highMemoryUsage: { threshold: 512, enabled: true },
      highFailureRate: { threshold: 0.1, enabled: true },
      resourceExhaustion: { threshold: 0.9, enabled: true }
    },

    reporting: {
      interval: 10000, // 10 seconds
      retention: 86400000, // 24 hours
      exportFormats: ['json', 'prometheus']
    }
  },

  // Caching strategy
  caching: {
    enabled: true,
    strategies: {
      results: {
        ttl: 3600000, // 1 hour
        maxSize: 1000, // entries
        keyGenerator: 'fileHash+contentHash'
      },
      dependencies: {
        ttl: 600000, // 10 minutes
        maxSize: 500,
        keyGenerator: 'dependencyHash'
      },
      coverage: {
        ttl: 1800000, // 30 minutes
        maxSize: 50,
        incremental: true
      }
    },

    invalidation: {
      onFileChange: true,
      onDependencyChange: true,
      onConfigurationChange: true,
      manual: true
    }
  },

  // Reporting configuration
  reporting: {
    formats: ['json', 'html', 'junit', 'markdown'],
    outputDir: 'test-results',

    reports: {
      summary: {
        enabled: true,
        includeMetrics: true,
        includeCoverage: true
      },
      detailed: {
        enabled: true,
        includeStackTraces: true,
        includeCoverageDetails: true,
        includePerformance: true
      },
      trend: {
        enabled: true,
        historySize: 100,
        compareWithBaseline: true
      },
      coverage: {
        enabled: true,
        formats: ['html', 'lcov', 'json'],
        thresholds: {
          statements: 80,
          branches: 80,
          functions: 80,
          lines: 80
        }
      },
      performance: {
        enabled: true,
        includeMemoryUsage: true,
        includeExecutionTime: true,
        benchmarkBaseline: true
      }
    },

    notifications: {
      slack: {
        enabled: false,
        webhook: process.env.SLACK_WEBHOOK_URL,
        channels: ['#dev-alerts'],
        onFailure: true,
        onSuccess: false
      },
      email: {
        enabled: false,
        recipients: ['dev-team@example.com'],
        onFailure: true,
        onSuccess: false
      }
    }
  },

  // CI/CD Integration
  ci: {
    enabled: true,
    providers: {
      github: {
        enabled: true,
        artifacts: {
          testResults: true,
          coverage: true,
          reports: true
        },
        comments: {
          summary: true,
          details: true
        }
      },
      jenkins: {
        enabled: false,
        junitReports: true,
        pipelineSteps: true
      }
    },

    environment: {
      testDatabase: {
        host: 'localhost',
        port: 5432,
        database: 'nasa_system6_test'
      },
      testServer: {
        host: 'localhost',
        port: 3001,
        healthCheck: '/health'
      }
    }
  },

  // Advanced features
  features: {
    smartSelection: {
      enabled: true,
      algorithms: ['changed-files', 'dependency-graph', 'failure-pattern'],
      maxSelectionRatio: 0.8
    },

    predictiveExecution: {
      enabled: true,
      useHistory: true,
      confidenceThreshold: 0.8
    },

    adaptiveParallelism: {
      enabled: true,
      initialWorkers: 'auto',
      maxWorkers: 'auto',
      scalingFactor: 1.5
    },

    faultTolerance: {
      enabled: true,
      retries: 3,
      circuitBreaker: {
        enabled: true,
        failureThreshold: 5,
        timeout: 60000
      }
    },

    resourceOptimization: {
      enabled: true,
      memoryPooling: true,
      connectionPooling: true,
      cacheWarming: true
    }
  }
};