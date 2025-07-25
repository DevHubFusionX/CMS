# CMS Backend API

Backend API for the Content Management System.

## Getting Started

### Installation

```bash
# Install dependencies
npm install
```

### Configuration

Create a `.env` file in the root directory with the following variables:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/cms
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=30d
```

### Running the Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Posts

- `GET /api/posts` - Get all published posts
- `GET /api/posts/all` - Get all posts (including drafts)
- `GET /api/posts/:id` - Get single post
- `POST /api/posts` - Create new post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post

### Categories

- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get single category
- `POST /api/categories` - Create new category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Tags

- `GET /api/tags` - Get all tags
- `GET /api/tags/:id` - Get single tag
- `POST /api/tags` - Create new tag
- `PUT /api/tags/:id` - Update tag
- `DELETE /api/tags/:id` - Delete tag

### Users

- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/:id` - Get single user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (Admin only)

### Comments

- `GET /api/comments` - Get all comments (Admin/Editor only)
- `GET /api/comments/post/:postId` - Get comments for a post
- `POST /api/comments` - Create a comment
- `PUT /api/comments/:id` - Update comment status (Admin/Editor only)
- `DELETE /api/comments/:id` - Delete comment

### Media

- `POST /api/media` - Upload media file
- `GET /api/media` - Get all media files
- `GET /api/media/:id` - Get single media file
- `DELETE /api/media/:id` - Delete media file

### Settings

- `GET /api/settings` - Get all settings
- `GET /api/settings/group/:group` - Get settings by group
- `PUT /api/settings` - Update settings (Admin only)