/**
 * Database Query Performance Benchmarking Script
 *
 * This script compares the performance of original vs optimized queries
 * for favorites and collections operations.
 */

const { pool } = require('../db');
const favoritesService = require('../services/favoritesService');
const collectionsService = require('../services/collectionsService');
const favoritesServiceOptimized = require('../services/favoritesServiceOptimized');
const collectionsServiceOptimized = require('../services/collectionsServiceOptimized');

class QueryBenchmark {
  constructor() {
    this.testUserId = '123e4567-e89b-12d3-a456-426614174000';
    this.results = [];
  }

  /**
   * Generate test data for benchmarking
   */
  async generateTestData(count = 1000) {
    console.log(`Generating ${count} test items...`);
    const client = await pool.connect();

    try {
      // Clean up existing test data
      await client.query('DELETE FROM saved_items WHERE user_id = $1', [this.testUserId]);
      await client.query('DELETE FROM collections WHERE user_id = $1', [this.testUserId]);

      // Insert test items
      const types = ['APOD', 'NEO', 'MARS', 'EPIC', 'EARTH', 'IMAGES'];
      const categories = ['space', 'planets', 'stars', 'nebulae', 'galaxies', 'asteroids'];
      const insertPromises = [];

      for (let i = 0; i < count; i++) {
        const type = types[Math.floor(Math.random() * types.length)];
        const category = categories[Math.floor(Math.random() * categories.length)];
        const isFavorite = Math.random() > 0.7;
        const hasTags = Math.random() > 0.6;
        const hasNote = Math.random() > 0.5;

        const insertPromise = client.query(`
          INSERT INTO saved_items (
            id, user_id, type, title, url, category, description,
            date, is_favorite, user_tags, user_note
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `, [
          `test_item_${i}`,
          this.testUserId,
          type,
          `Test Item ${i}: ${type} ${category}`,
          `https://example.com/item-${i}.jpg`,
          category,
          `Description for test item ${i} with category ${category}`,
          new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          isFavorite,
          hasTags ? ['space', category, type] : [],
          hasNote ? `Personal note for item ${i}` : null
        ]);

        insertPromises.push(insertPromise);

        // Batch every 100 inserts to avoid memory issues
        if (insertPromises.length >= 100) {
          await Promise.all(insertPromises);
          insertPromises.length = 0;
        }
      }

      // Insert remaining items
      if (insertPromises.length > 0) {
        await Promise.all(insertPromises);
      }

      // Create test collections
      const collections = [];
      for (let i = 0; i < 10; i++) {
        const result = await client.query(`
          INSERT INTO collections (user_id, name, description, is_public)
          VALUES ($1, $2, $3, $4)
          RETURNING id
        `, [
          this.testUserId,
          `Test Collection ${i + 1}`,
          `Description for test collection ${i + 1}`,
          i % 3 === 0  // Every 3rd collection is public
        ]);

        collections.push(result.rows[0].id);
      }

      // Add items to collections
      let itemCounter = 0;
      for (const collectionId of collections) {
        const itemsPerCollection = Math.floor(Math.random() * 50) + 10;

        for (let i = 0; i < itemsPerCollection && itemCounter < count; i++) {
          await client.query(`
            INSERT INTO collection_items (collection_id, item_id, position, notes)
            VALUES ($1, $2, $3, $4)
          `, [
            collectionId,
            `test_item_${itemCounter}`,
            i,
            `Note for item ${itemCounter} in collection`
          ]);

          itemCounter++;
        }
      }

      console.log('Test data generation complete');
    } finally {
      client.release();
    }
  }

  /**
   * Measure query execution time
   */
  async measureTime(queryName, queryFunction) {
    const startTime = process.hrtime.bigint();

    try {
      const result = await queryFunction();
      const endTime = process.hrtime.bigint();
      const executionTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds

      console.log(`${queryName}: ${executionTime.toFixed(2)}ms`);

      return {
        queryName,
        executionTime,
        result,
        success: true
      };
    } catch (error) {
      const endTime = process.hrtime.bigint();
      const executionTime = Number(endTime - startTime) / 1000000;

      console.error(`${queryName}: FAILED (${executionTime.toFixed(2)}ms) - ${error.message}`);

      return {
        queryName,
        executionTime,
        error: error.message,
        success: false
      };
    }
  }

  /**
   * Benchmark favorites queries
   */
  async benchmarkFavorites() {
    console.log('\n=== Favorites Query Benchmarks ===');

    const tests = [
      // Basic queries
      {
        name: 'Original: Get 20 favorites (page 1)',
        test: () => favoritesService.getFavorites(this.testUserId, { page: 1, limit: 20 })
      },
      {
        name: 'Optimized: Get 20 favorites (page 1)',
        test: () => favoritesServiceOptimized.getFavorites(this.testUserId, { page: 1, limit: 20 })
      },

      // Pagination tests
      {
        name: 'Original: Get favorites page 10 (offset)',
        test: () => favoritesService.getFavorites(this.testUserId, { page: 10, limit: 20 })
      },
      {
        name: 'Optimized: Get favorites page 10 (offset)',
        test: () => favoritesServiceOptimized.getFavorites(this.testUserId, { page: 10, limit: 20 })
      },

      // Type filtering
      {
        name: 'Original: Get APOD favorites only',
        test: () => favoritesService.getFavorites(this.testUserId, { type: 'APOD', limit: 50 })
      },
      {
        name: 'Optimized: Get APOD favorites only',
        test: () => favoritesServiceOptimized.getFavorites(this.testUserId, { type: 'APOD', limit: 50 })
      },

      // Search queries
      {
        name: 'Original: Search "space"',
        test: () => favoritesService.searchFavorites(this.testUserId, 'space', { page: 1, limit: 20 })
      },
      {
        name: 'Optimized: Search "space"',
        test: () => favoritesServiceOptimized.searchFavorites(this.testUserId, 'space', { page: 1, limit: 20 })
      },

      // Complex search with filters
      {
        name: 'Original: Complex search with filters',
        test: () => favoritesService.searchFavorites(this.testUserId, 'space', {
          types: ['APOD', 'NEO'],
          tags: ['space'],
          limit: 50
        })
      },
      {
        name: 'Optimized: Complex search with filters',
        test: () => favoritesServiceOptimized.searchFavorites(this.testUserId, 'space', {
          types: ['APOD', 'NEO'],
          tags: ['space'],
          limit: 50
        })
      },

      // Statistics
      {
        name: 'Original: Get favorite statistics',
        test: () => favoritesService.getFavoriteStats(this.testUserId)
      },
      {
        name: 'Optimized: Get favorite statistics',
        test: () => favoritesServiceOptimized.getFavoriteStats(this.testUserId)
      }
    ];

    const results = [];
    for (const test of tests) {
      const result = await this.measureTime(test.name, test.test);
      results.push(result);

      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return results;
  }

  /**
   * Benchmark collections queries
   */
  async benchmarkCollections() {
    console.log('\n=== Collections Query Benchmarks ===');

    const tests = [
      // Get collections
      {
        name: 'Original: Get user collections',
        test: () => collectionsService.getCollections(this.testUserId, { page: 1, limit: 20 })
      },
      {
        name: 'Optimized: Get user collections',
        test: () => collectionsServiceOptimized.getCollections(this.testUserId, { page: 1, limit: 20 })
      },

      // Get collection with items
      {
        name: 'Original: Get collection items',
        test: async () => {
          const collections = await collectionsService.getCollections(this.testUserId, { limit: 1 });
          if (collections.collections.length > 0) {
            return collectionsService.getCollectionItems(collections.collections[0].id, { page: 1, limit: 20 });
          }
          return { items: [] };
        }
      },
      {
        name: 'Optimized: Get collection items',
        test: async () => {
          const collections = await collectionsServiceOptimized.getCollections(this.testUserId, { limit: 1 });
          if (collections.collections.length > 0) {
            return collectionsServiceOptimized.getCollectionItems(collections.collections[0].id, { page: 1, limit: 20 });
          }
          return { items: [] };
        }
      },

      // Public collections
      {
        name: 'Original: Get public collections',
        test: () => collectionsService.getPublicCollections({ page: 1, limit: 20 })
      },
      {
        name: 'Optimized: Get public collections',
        test: () => collectionsServiceOptimized.getPublicCollections({ page: 1, limit: 20 })
      },

      // Search public collections
      {
        name: 'Original: Search public collections',
        test: () => collectionsService.getPublicCollections({ search: 'space', page: 1, limit: 20 })
      },
      {
        name: 'Optimized: Search public collections',
        test: () => collectionsServiceOptimized.getPublicCollections({ search: 'space', page: 1, limit: 20 })
      },

      // Statistics
      {
        name: 'Original: Get collection statistics',
        test: () => collectionsService.getCollectionStats(this.testUserId)
      },
      {
        name: 'Optimized: Get collection statistics',
        test: () => collectionsServiceOptimized.getCollectionStats(this.testUserId)
      }
    ];

    const results = [];
    for (const test of tests) {
      const result = await this.measureTime(test.name, test.test);
      results.push(result);

      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return results;
  }

  /**
   * Benchmark direct SQL queries
   */
  async benchmarkDirectQueries() {
    console.log('\n=== Direct SQL Query Benchmarks ===');

    const client = await pool.connect();

    const tests = [
      {
        name: 'Simple SELECT with pagination',
        query: `
          SELECT * FROM saved_items
          WHERE user_id = $1 AND is_archived = false
          ORDER BY saved_at DESC
          LIMIT $2 OFFSET $3
        `,
        params: [this.testUserId, 20, 100]
      },
      {
        name: 'Complex JOIN with aggregation',
        query: `
          SELECT
            si.*,
            COUNT(ci.id) as collection_count,
            ARRAY_AGG(DISTINCT c.name) as collection_names
          FROM saved_items si
          LEFT JOIN collection_items ci ON si.id = ci.item_id
          LEFT JOIN collections c ON ci.collection_id = c.id
          WHERE si.user_id = $1 AND si.is_archived = false
          GROUP BY si.id
          ORDER BY si.saved_at DESC
          LIMIT $2
        `,
        params: [this.testUserId, 20]
      },
      {
        name: 'Full-text search',
        query: `
          SELECT
            si.*,
            ts_rank(
              to_tsvector('english', si.title || ' ' || si.description),
              plainto_tsquery('english', $2)
            ) as relevance_score
          FROM saved_items si
          WHERE si.user_id = $1
          AND si.is_archived = false
          AND to_tsvector('english', si.title || ' ' || si.description) @@ plainto_tsquery('english', $2)
          ORDER BY relevance_score DESC
          LIMIT $3
        `,
        params: [this.testUserId, 'space', 20]
      },
      {
        name: 'Optimized function call',
        query: 'SELECT * FROM get_user_favorites_optimized($1, 1, 20, NULL, false, NULL, \'saved_at\')',
        params: [this.testUserId]
      }
    ];

    const results = [];
    for (const test of tests) {
      const result = await this.measureTime(test.name, async () => {
        return await client.query(test.query, test.params);
      });
      results.push(result);
    }

    client.release();
    return results;
  }

  /**
   * Run cache performance tests
   */
  async benchmarkCache() {
    console.log('\n=== Cache Performance Tests ===');

    // First call (cache miss)
    const missResult = await this.measureTime(
      'Optimized: First call (cache miss)',
      () => favoritesServiceOptimized.getFavorites(this.testUserId, { page: 1, limit: 20 })
    );

    // Second call (cache hit)
    const hitResult = await this.measureTime(
      'Optimized: Second call (cache hit)',
      () => favoritesServiceOptimized.getFavorites(this.testUserId, { page: 1, limit: 20 })
    );

    // Search cache test
    const searchMissResult = await this.measureTime(
      'Optimized: Search first call (cache miss)',
      () => favoritesServiceOptimized.searchFavorites(this.testUserId, 'space', { page: 1, limit: 20 })
    );

    const searchHitResult = await this.measureTime(
      'Optimized: Search second call (cache hit)',
      () => favoritesServiceOptimized.searchFavorites(this.testUserId, 'space', { page: 1, limit: 20 })
    );

    return [missResult, hitResult, searchMissResult, searchHitResult];
  }

  /**
   * Generate performance report
   */
  generateReport(allResults) {
    console.log('\n=== Performance Report ===');

    const originalResults = allResults.filter(r => r.queryName.includes('Original'));
    const optimizedResults = allResults.filter(r => r.queryName.includes('Optimized'));

    console.log('\nOriginal Queries:');
    originalResults.forEach(result => {
      console.log(`  ${result.queryName}: ${result.executionTime.toFixed(2)}ms`);
    });

    console.log('\nOptimized Queries:');
    optimizedResults.forEach(result => {
      console.log(`  ${result.queryName}: ${result.executionTime.toFixed(2)}ms`);
    });

    // Calculate improvements
    const improvements = [];
    originalResults.forEach(original => {
      const baseName = original.queryName.replace('Original: ', '');
      const optimized = optimizedResults.find(opt =>
        opt.queryName.replace('Optimized: ', '') === baseName
      );

      if (optimized && original.success && optimized.success) {
        const improvement = ((original.executionTime - optimized.executionTime) / original.executionTime) * 100;
        improvements.push({
          query: baseName,
          original: original.executionTime,
          optimized: optimized.executionTime,
          improvement: improvement
        });
      }
    });

    if (improvements.length > 0) {
      console.log('\nPerformance Improvements:');
      improvements.forEach(imp => {
        const arrow = imp.improvement > 0 ? '↑' : '↓';
        console.log(`  ${arrow} ${imp.query}: ${Math.abs(imp.improvement).toFixed(1)}% improvement`);
        console.log(`    (Original: ${imp.original.toFixed(2)}ms → Optimized: ${imp.optimized.toFixed(2)}ms)`);
      });

      const avgImprovement = improvements.reduce((sum, imp) => sum + imp.improvement, 0) / improvements.length;
      console.log(`\nAverage Performance Improvement: ${avgImprovement.toFixed(1)}%`);
    }

    // Cache performance
    const cacheResults = allResults.filter(r => r.queryName.includes('cache'));
    if (cacheResults.length >= 2) {
      const cacheMiss = cacheResults.find(r => r.queryName.includes('cache miss'));
      const cacheHit = cacheResults.find(r => r.queryName.includes('cache hit'));

      if (cacheMiss && cacheHit) {
        const cacheSpeedup = ((cacheMiss.executionTime - cacheHit.executionTime) / cacheMiss.executionTime) * 100;
        console.log(`\nCache Performance: ${cacheSpeedup.toFixed(1)}% faster on cache hit`);
      }
    }

    return {
      originalResults,
      optimizedResults,
      improvements,
      cacheResults
    };
  }

  /**
   * Run full benchmark suite
   */
  async runBenchmark() {
    console.log('Starting Database Query Performance Benchmark...\n');

    try {
      // Generate test data
      await this.generateTestData(1000);

      // Run all benchmark tests
      const favoritesResults = await this.benchmarkFavorites();
      const collectionsResults = await this.benchmarkCollections();
      const directResults = await this.benchmarkDirectQueries();
      const cacheResults = await this.benchmarkCache();

      const allResults = [...favoritesResults, ...collectionsResults, ...directResults, ...cacheResults];

      // Generate report
      const report = this.generateReport(allResults);

      return report;

    } catch (error) {
      console.error('Benchmark failed:', error);
      throw error;
    }
  }
}

// Run benchmark if this file is executed directly
if (require.main === module) {
  const benchmark = new QueryBenchmark();

  benchmark.runBenchmark()
    .then(report => {
      console.log('\nBenchmark completed successfully!');

      // Save report to file
      const fs = require('fs');
      const reportData = {
        timestamp: new Date().toISOString(),
        ...report
      };

      fs.writeFileSync(
        '/Users/edsaga/stylesnprofiles/server/benchmark-report.json',
        JSON.stringify(reportData, null, 2)
      );

      console.log('Detailed report saved to: benchmark-report.json');
    })
    .catch(error => {
      console.error('Benchmark failed:', error);
      process.exit(1);
    });
}

module.exports = QueryBenchmark;