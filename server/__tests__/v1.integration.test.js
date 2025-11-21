/**
 * V1 API Integration Tests
 *
 * Tests the new V1 API endpoints with real database connections.
 */

const request = require('supertest');
const express = require('express');
const { initDb, pool } = require('../db');

// Import routes
const authRouter = require('../routes/auth');
const favoritesRouter = require('../routes/favorites');
const collectionsRouter = require('../routes/collections');
const { authenticateToken } = require('../middleware/auth');

// Create test app
const app = express();
app.use(express.json());

// Mount routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users/favorites', authenticateToken, favoritesRouter);
app.use('/api/v1/users/collections', authenticateToken, collectionsRouter);

describe('V1 API Integration Tests', () => {
  let authToken;
  let userId;

  beforeAll(async () => {
    await initDb();
  }, 30000);

  afterAll(async () => {
    await pool.end();
  });

  describe('Authentication', () => {
    const testUser = {
      email: `test-${Date.now()}@example.com`,
      username: `testuser-${Date.now()}`,
      password: 'password123',
    };

    test('POST /api/v1/auth/register should register a new user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'User registered successfully');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', testUser.email);

      userId = response.body.user.id;
    });

    test('POST /api/v1/auth/login should login user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body).toHaveProperty('token');
      authToken = response.body.token;
    });
  });

  describe('Favorites', () => {
    test('POST /api/v1/users/favorites should add a favorite', async () => {
      const testItem = {
        id: 'apod-2024-01-01',
        type: 'APOD',
        title: 'Test APOD',
        url: 'https://example.com/image.jpg',
        date: '2024-01-01',
      };

      const response = await request(app)
        .post('/api/v1/users/favorites')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testItem)
        .expect(201);

      expect(response.body).toHaveProperty('id', testItem.id);
      expect(response.body).toHaveProperty('title', testItem.title);
    });

    test('GET /api/v1/users/favorites should list favorites', async () => {
      const response = await request(app)
        .get('/api/v1/users/favorites')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('favorites');
      expect(Array.isArray(response.body.favorites)).toBe(true);
      expect(response.body.favorites.length).toBeGreaterThan(0);
      expect(response.body.favorites[0]).toHaveProperty('id', 'apod-2024-01-01');
    });
  });

  describe('Collections', () => {
    let collectionId;

    test('POST /api/v1/users/collections should create a collection', async () => {
      const collection = {
        name: 'My Test Collection',
        description: 'A collection for testing',
        is_public: true,
      };

      const response = await request(app)
        .post('/api/v1/users/collections')
        .set('Authorization', `Bearer ${authToken}`)
        .send(collection)
        .expect(201);

      expect(response.body).toHaveProperty('name', collection.name);
      expect(response.body).toHaveProperty('id');
      collectionId = response.body.id;
    });

    test('POST /api/v1/users/collections/:id/items should add item to collection', async () => {
      const response = await request(app)
        .post(`/api/v1/users/collections/${collectionId}/items`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ itemId: 'apod-2024-01-01' })
        .expect(201);

      // Expecting the added item or success message
      // Based on service, it returns the added item relation
      expect(response.body).toHaveProperty('collection_id', collectionId);
      expect(response.body).toHaveProperty('item_id', 'apod-2024-01-01');
    });

    test('GET /api/v1/users/collections/:id/items should list collection items', async () => {
      const response = await request(app)
        .get(`/api/v1/users/collections/${collectionId}/items`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0]).toHaveProperty('id', 'apod-2024-01-01');
    });
  });
});
