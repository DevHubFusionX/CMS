const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../index'); // Import your Express app
const Post = require('../models/Post');
const User = require('../models/User');

let mongoServer;
let token;
let testUserId;
let testPostId;

// Setup test database before tests
beforeAll(async () => {
  // Create in-memory MongoDB instance
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  
  // Create test user
  const testUser = await User.create({
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    role: 'admin'
  });
  
  testUserId = testUser._id;
  
  // Login to get token
  const response = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'test@example.com',
      password: 'password123'
    });
  
  token = response.body.token;
});

// Clean up after tests
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Post API', () => {
  // Test creating a post
  test('Should create a new post', async () => {
    const response = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Test Post',
        content: '<p>This is a test post content</p>',
        status: 'draft',
        language: 'en',
        focusKeyword: 'test'
      });
    
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.title).toBe('Test Post');
    
    testPostId = response.body.data._id;
  });
  
  // Test getting a post
  test('Should get a post by ID', async () => {
    const response = await request(app)
      .get(`/api/posts/${testPostId}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.title).toBe('Test Post');
  });
  
  // Test updating a post
  test('Should update a post', async () => {
    const response = await request(app)
      .put(`/api/posts/${testPostId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Updated Test Post',
        content: '<p>This is updated content</p>'
      });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.title).toBe('Updated Test Post');
  });
  
  // Test scheduling a post
  test('Should schedule a post for future publication', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1); // Tomorrow
    
    const response = await request(app)
      .put(`/api/posts/${testPostId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        status: 'scheduled',
        scheduledDate: futureDate
      });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('scheduled');
    expect(new Date(response.body.data.scheduledDate)).toEqual(futureDate);
  });
  
  // Test version history
  test('Should create a new version when updating content', async () => {
    // First update to create a version
    await request(app)
      .put(`/api/posts/${testPostId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        content: '<p>Version 1 content</p>'
      });
    
    // Second update to create another version
    await request(app)
      .put(`/api/posts/${testPostId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        content: '<p>Version 2 content</p>'
      });
    
    // Get versions
    const response = await request(app)
      .get(`/api/posts/${testPostId}/versions`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.length).toBeGreaterThanOrEqual(2);
  });
  
  // Test multilingual support
  test('Should create a translation of a post', async () => {
    const response = await request(app)
      .post(`/api/posts/${testPostId}/translate`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        language: 'es'
      });
    
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.language).toBe('es');
    
    // Check that original post has translation reference
    const originalPost = await request(app)
      .get(`/api/posts/${testPostId}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(originalPost.body.data.translations.length).toBe(1);
    expect(originalPost.body.data.translations[0].language).toBe('es');
  });
  
  // Test deleting a post
  test('Should delete a post', async () => {
    const response = await request(app)
      .delete(`/api/posts/${testPostId}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    
    // Verify post is deleted
    const getResponse = await request(app)
      .get(`/api/posts/${testPostId}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(getResponse.status).toBe(404);
  });
});