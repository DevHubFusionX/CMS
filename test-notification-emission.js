// Test script to verify Socket.IO notification emission
// This simulates the server-side notification emission

const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = createServer(app);

// CORS configuration for Socket.IO
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:5173"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(cors());
app.use(express.json());

// Store connected users by role
const connectedUsers = {
  editor: new Set(),
  admin: new Set(),
  super_admin: new Set()
};

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`👤 User connected: ${socket.id}`);
  
  // Handle role-based room joining
  socket.on('join_role', (data) => {
    const { role, userId } = data;
    socket.join(role);
    socket.userId = userId;
    socket.userRole = role;
    
    // Track connected users
    if (connectedUsers[role]) {
      connectedUsers[role].add(socket.id);
    }
    
    console.log(`📝 User ${socket.id} (${userId}) joined ${role} room`);
    console.log(`   Active ${role}s:`, connectedUsers[role]?.size || 0);
  });
  
  socket.on('disconnect', () => {
    console.log(`👋 User disconnected: ${socket.id}`);
    
    // Remove from tracking
    if (socket.userRole && connectedUsers[socket.userRole]) {
      connectedUsers[socket.userRole].delete(socket.id);
    }
  });
});

// Test endpoint to simulate post creation
app.post('/api/test-post', (req, res) => {
  console.log('📝 Simulating post creation...');
  
  const postData = {
    id: 'test-post-' + Date.now(),
    title: req.body.title || 'Test Post',
    author: {
      name: req.body.authorName || 'Test Author',
      _id: 'test-author-123'
    },
    status: 'draft',
    createdAt: new Date(),
    message: `New post "${req.body.title || 'Test Post'}" created by ${req.body.authorName || 'Test Author'}`
  };
  
  // Emit notification to editors, admins, and super_admins
  console.log('📤 Emitting notification to editors...');
  io.to('editor').to('admin').to('super_admin').emit('new_post_created', postData);
  
  console.log('✅ Notification sent to:');
  console.log(`   Editors: ${connectedUsers.editor.size}`);
  console.log(`   Admins: ${connectedUsers.admin.size}`);
  console.log(`   Super Admins: ${connectedUsers.super_admin.size}`);
  
  res.json({
    success: true,
    message: 'Test post created and notification sent',
    data: postData
  });
});

// Status endpoint
app.get('/status', (req, res) => {
  res.json({
    success: true,
    connectedUsers: {
      editor: connectedUsers.editor.size,
      admin: connectedUsers.admin.size,
      super_admin: connectedUsers.super_admin.size
    },
    totalConnections: io.engine.clientsCount
  });
});

const PORT = 3001; // Use different port to avoid conflicts
server.listen(PORT, () => {
  console.log('🚀 Test Socket.IO server running on port', PORT);
  console.log('📋 Test Instructions:');
  console.log('1. Run this server: node test-notification-emission.js');
  console.log('2. In another terminal, run: node simple-socket-test.js');
  console.log('3. Test post creation: curl -X POST http://localhost:3001/api/test-post -H "Content-Type: application/json" -d \'{"title":"My Test Post","authorName":"John Doe"}\'');
  console.log('4. Check status: curl http://localhost:3001/status');
});