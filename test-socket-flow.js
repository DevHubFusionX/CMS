const io = require('socket.io-client');
const axios = require('axios');

const SERVER_URL = 'http://localhost:5000';

class NotificationFlowTest {
  constructor() {
    this.editorSocket = null;
    this.authToken = null;
    this.csrfToken = null;
  }

  async authenticate() {
    try {
      console.log('🔐 Authenticating as test user...');
      
      // First get CSRF token
      const csrfResponse = await axios.get(`${SERVER_URL}/api/csrf-token`);
      this.csrfToken = csrfResponse.data.csrfToken;
      console.log('✅ CSRF token obtained');

      // Login as test user (you may need to create this user first)
      const loginResponse = await axios.post(`${SERVER_URL}/api/auth/login`, {
        email: 'author@test.com', // Change to your test author email
        password: 'password123'   // Change to your test author password
      }, {
        headers: {
          'X-CSRF-Token': this.csrfToken
        }
      });

      if (loginResponse.data.success) {
        this.authToken = loginResponse.data.token;
        console.log('✅ Authentication successful');
        return true;
      } else {
        console.log('❌ Authentication failed:', loginResponse.data.message);
        return false;
      }
    } catch (error) {
      console.log('❌ Authentication error:', error.response?.data?.message || error.message);
      return false;
    }
  }

  connectEditor() {
    return new Promise((resolve) => {
      console.log('📝 Connecting as editor...');
      
      this.editorSocket = io(SERVER_URL);
      
      this.editorSocket.on('connect', () => {
        console.log('✅ Editor connected to Socket.IO');
        
        // Join editor room
        this.editorSocket.emit('join_role', {
          role: 'editor',
          userId: 'test-editor-123'
        });
        
        console.log('✅ Editor joined role-based room');
        resolve();
      });

      this.editorSocket.on('connect_error', (error) => {
        console.log('❌ Editor connection failed:', error.message);
        resolve();
      });

      this.editorSocket.on('new_post_created', (data) => {
        console.log('🔔 NOTIFICATION RECEIVED!');
        console.log('   Message:', data.message);
        console.log('   Post ID:', data.id);
        console.log('   Author:', data.author?.name);
        console.log('   Status:', data.status);
        console.log('   Created:', new Date(data.createdAt).toLocaleString());
        console.log('✅ Socket.IO notification flow working correctly!');
      });
    });
  }

  async createTestPost() {
    try {
      console.log('✍️ Creating test post as author...');
      
      const postData = {
        title: `Test Post - ${new Date().toLocaleTimeString()}`,
        content: 'This is a test post created to verify Socket.IO notifications work correctly.',
        status: 'draft',
        categories: [],
        tags: []
      };

      const response = await axios.post(`${SERVER_URL}/api/posts`, postData, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'X-CSRF-Token': this.csrfToken,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        console.log('✅ Post created successfully!');
        console.log('   Title:', response.data.data.title);
        console.log('   ID:', response.data.data._id);
        console.log('   Status:', response.data.data.status);
        console.log('⏳ Waiting for Socket.IO notification...');
        return true;
      } else {
        console.log('❌ Post creation failed:', response.data.message);
        return false;
      }
    } catch (error) {
      console.log('❌ Post creation error:', error.response?.data?.message || error.message);
      return false;
    }
  }

  disconnect() {
    if (this.editorSocket) {
      this.editorSocket.disconnect();
      console.log('🔌 Editor disconnected');
    }
  }

  async runTest() {
    console.log('🧪 Starting Socket.IO Notification Flow Test');
    console.log('=' .repeat(50));

    // Step 1: Authenticate
    const authSuccess = await this.authenticate();
    if (!authSuccess) {
      console.log('❌ Test failed: Could not authenticate');
      return;
    }

    // Step 2: Connect editor
    await this.connectEditor();
    
    // Wait a moment for connection to stabilize
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 3: Create post (should trigger notification)
    const postSuccess = await this.createTestPost();
    if (!postSuccess) {
      console.log('❌ Test failed: Could not create post');
      this.disconnect();
      return;
    }

    // Wait for notification
    console.log('⏳ Waiting 3 seconds for notification...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Cleanup
    this.disconnect();
    console.log('🏁 Test completed');
  }
}

// Run the test
const test = new NotificationFlowTest();
test.runTest().catch(console.error);