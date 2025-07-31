const fs = require('fs').promises;
const path = require('path');
const Post = require('../models/Post');
const User = require('../models/User');
const Category = require('../models/Category');
const Comment = require('../models/Comment');
const logger = require('./logger');

const BACKUP_DIR = path.join(__dirname, '../backups');

// Ensure backup directory exists
const ensureBackupDir = async () => {
  try {
    await fs.access(BACKUP_DIR);
  } catch {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
  }
};

// Create full content backup
const createBackup = async () => {
  try {
    await ensureBackupDir();
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(BACKUP_DIR, `backup-${timestamp}.json`);
    
    // Fetch all data
    const [posts, users, categories, comments] = await Promise.all([
      Post.find().populate('author categories'),
      User.find().select('-password -tokenBlacklist'),
      Category.find(),
      Comment.find().populate('author post')
    ]);
    
    const backupData = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      data: {
        posts,
        users,
        categories,
        comments
      },
      stats: {
        postsCount: posts.length,
        usersCount: users.length,
        categoriesCount: categories.length,
        commentsCount: comments.length
      }
    };
    
    await fs.writeFile(backupFile, JSON.stringify(backupData, null, 2));
    
    // Clean old backups (keep last 10)
    await cleanOldBackups();
    
    logger.info(`Backup created successfully: ${backupFile}`);
    return backupFile;
  } catch (error) {
    logger.error('Backup creation failed:', error);
    throw error;
  }
};

// Clean old backup files
const cleanOldBackups = async () => {
  try {
    const files = await fs.readdir(BACKUP_DIR);
    const backupFiles = files
      .filter(file => file.startsWith('backup-') && file.endsWith('.json'))
      .sort()
      .reverse();
    
    // Keep only the 10 most recent backups
    const filesToDelete = backupFiles.slice(10);
    
    for (const file of filesToDelete) {
      await fs.unlink(path.join(BACKUP_DIR, file));
      logger.info(`Deleted old backup: ${file}`);
    }
  } catch (error) {
    logger.error('Error cleaning old backups:', error);
  }
};

// Get list of available backups
const getBackupList = async () => {
  try {
    await ensureBackupDir();
    const files = await fs.readdir(BACKUP_DIR);
    const backupFiles = files
      .filter(file => file.startsWith('backup-') && file.endsWith('.json'))
      .sort()
      .reverse();
    
    const backups = [];
    for (const file of backupFiles) {
      const filePath = path.join(BACKUP_DIR, file);
      const stats = await fs.stat(filePath);
      backups.push({
        filename: file,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime
      });
    }
    
    return backups;
  } catch (error) {
    logger.error('Error getting backup list:', error);
    return [];
  }
};

module.exports = {
  createBackup,
  getBackupList,
  cleanOldBackups
};