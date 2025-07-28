const logger = require('./logger');

class NotificationService {
  constructor(io) {
    this.io = io;
  }

  // Notify editors when authors create posts
  notifyNewPost(post, author) {
    if (!this.io) return;
    
    this.io.to('editor').to('admin').to('super_admin').emit('new_post_created', {
      id: post._id,
      title: post.title,
      author: {
        id: author._id,
        name: author.name,
        avatar: author.avatar
      },
      status: post.status,
      createdAt: post.createdAt,
      message: `New post "${post.title}" created by ${author.name}`
    });
    
    logger.info(`Notification sent: New post "${post.title}" by ${author.name}`);
  }

  // Notify when post status changes (draft -> published, etc.)
  notifyPostStatusChange(post, author, oldStatus, newStatus) {
    if (!this.io) return;
    
    this.io.to('editor').to('admin').to('super_admin').emit('post_status_changed', {
      id: post._id,
      title: post.title,
      author: {
        id: author._id,
        name: author.name,
        avatar: author.avatar
      },
      oldStatus,
      newStatus,
      updatedAt: post.updatedAt,
      message: `Post "${post.title}" status changed from ${oldStatus} to ${newStatus}`
    });
    
    logger.info(`Notification sent: Post "${post.title}" status changed to ${newStatus}`);
  }
}

module.exports = NotificationService;