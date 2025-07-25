const axios = require('axios');

// Test user data
const testUser = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'password123'
};

// Base URL for API
const API_URL = 'http://localhost:5000/api';

// Test registration
async function testRegistration() {
  console.log('\n--- Testing Registration ---');
  try {
    const response = await axios.post(`${API_URL}/auth/register`, testUser);
    console.log('✅ Registration successful!');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return response.data.token;
  } catch (error) {
    console.error('❌ Registration failed!');
    console.error('Status:', error.response?.status);
    console.error('Error:', error.response?.data || error.message);
    return null;
  }
}

// Test login
async function testLogin() {
  console.log('\n--- Testing Login ---');
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    console.log('✅ Login successful!');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return response.data.token;
  } catch (error) {
    console.error('❌ Login failed!');
    console.error('Status:', error.response?.status);
    console.error('Error:', error.response?.data || error.message);
    return null;
  }
}

// Test get current user
async function testGetMe(token) {
  console.log('\n--- Testing Get Current User ---');
  try {
    const response = await axios.get(`${API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('✅ Get current user successful!');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Get current user failed!');
    console.error('Status:', error.response?.status);
    console.error('Error:', error.response?.data || error.message);
  }
}

// Run tests
async function runTests() {
  console.log('=== Starting API Authentication Tests ===');
  
  // First try to register
  let token = await testRegistration();
  
  // If registration fails (possibly because user already exists), try login
  if (!token) {
    token = await testLogin();
  }
  
  // If we have a token, test getting the current user
  if (token) {
    await testGetMe(token);
  }
  
  console.log('\n=== Tests Completed ===');
}

// Execute tests
runTests();