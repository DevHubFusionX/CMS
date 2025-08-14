const User = require('../models/User');
const Post = require('../models/Post');

describe('Simple Model Tests', () => {
  test('User model should be defined', () => {
    expect(User).toBeDefined();
  });

  test('Post model should be defined', () => {
    expect(Post).toBeDefined();
  });

  test('Should create a user with valid data', async () => {
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'TestPassword123!',
      legacyRole: 'admin',
      isEmailVerified: true
    };

    const user = new User(userData);
    expect(user.name).toBe('Test User');
    expect(user.email).toBe('test@example.com');
    expect(user.legacyRole).toBe('admin');
  });

  test('Should create a post with valid data', async () => {
    const postData = {
      title: 'Test Post',
      content: '<p>This is a test post</p>',
      status: 'draft',
      language: 'en'
    };

    const post = new Post(postData);
    expect(post.title).toBe('Test Post');
    expect(post.status).toBe('draft');
    expect(post.language).toBe('en');
  });
});