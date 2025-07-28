const io = require('socket.io-client');

console.log('🧪 Simple Socket.IO Connection Test');
console.log('=' .repeat(40));

// Test Socket.IO connection without authentication
const socket = io('http://localhost:3001');

socket.on('connect', () => {
  console.log('✅ Connected to Socket.IO server');
  console.log('   Socket ID:', socket.id);
  
  // Test joining a role-based room
  socket.emit('join_role', {
    role: 'editor',
    userId: 'test-user-123'
  });
  
  console.log('📝 Joined editor room');
  
  // Listen for test notifications
  socket.on('new_post_created', (data) => {
    console.log('🔔 Received notification:');
    console.log('   Message:', data.message);
    console.log('   Post ID:', data.id);
    console.log('   Author:', data.author?.name || 'Unknown');
  });
  
  // Simulate a notification after 2 seconds
  setTimeout(() => {
    console.log('📤 Simulating notification emission...');
    // This would normally be done by the server when a post is created
    socket.emit('test_notification', {
      id: 'test-post-123',
      title: 'Test Post',
      message: 'Test notification from Socket.IO',
      author: { name: 'Test Author' }
    });
  }, 2000);
  
  // Disconnect after 5 seconds
  setTimeout(() => {
    console.log('🔌 Disconnecting...');
    socket.disconnect();
  }, 5000);
});

socket.on('connect_error', (error) => {
  console.log('❌ Connection failed:', error.message);
  console.log('💡 Make sure the test server is running on port 3001');
});

socket.on('disconnect', (reason) => {
  console.log('🔌 Disconnected:', reason);
  console.log('🏁 Test completed');
  process.exit(0);
});