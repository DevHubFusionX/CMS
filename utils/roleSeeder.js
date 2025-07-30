const Role = require('../models/Role');

const seedRoles = async () => {
  try {
    // Clear existing roles
    await Role.deleteMany({});
    
    const roles = [
      {
        name: 'visitor',
        displayName: 'Visitor',
        description: 'Unauthenticated user with read-only access',
        permissions: ['view_posts'],
        level: 0
      },
      {
        name: 'subscriber',
        displayName: 'Subscriber',
        description: 'Authenticated reader with comment privileges',
        permissions: ['view_posts', 'create_comments', 'view_profile', 'edit_own_profile', 'manage_own_comments'],
        level: 1
      },
      {
        name: 'student',
        displayName: 'Student',
        description: 'Can enroll in courses and access learning materials',
        permissions: ['view_posts', 'enroll_courses', 'view_courses', 'take_quizzes', 'view_certificates', 'view_profile', 'edit_own_profile', 'access_dashboard'],
        level: 2
      },
      {
        name: 'contributor',
        displayName: 'Contributor',
        description: 'Can create drafts and submit for review',
        permissions: ['view_posts', 'create_drafts', 'edit_own_posts', 'submit_for_review', 'view_profile', 'edit_own_profile', 'access_dashboard'],
        level: 3
      },
      {
        name: 'author',
        displayName: 'Author',
        description: 'Can create, edit, publish and delete own posts',
        permissions: ['view_posts', 'create_posts', 'edit_own_posts', 'delete_own_posts', 'publish_posts', 'upload_media', 'manage_own_media', 'view_profile', 'edit_own_profile', 'access_dashboard'],
        level: 4
      },
      {
        name: 'instructor',
        displayName: 'Instructor',
        description: 'Can create and manage courses, teach students',
        permissions: ['view_posts', 'create_courses', 'edit_own_courses', 'manage_enrollments', 'grade_assignments', 'view_course_analytics', 'upload_media', 'manage_own_media', 'view_profile', 'edit_own_profile', 'access_dashboard'],
        level: 5
      },
      {
        name: 'editor',
        displayName: 'Editor',
        description: 'Can manage all content, pages, categories and moderate comments',
        permissions: ['view_posts', 'create_posts', 'edit_all_posts', 'delete_all_posts', 'publish_posts', 'create_pages', 'edit_pages', 'delete_pages', 'manage_categories', 'manage_tags', 'upload_media', 'manage_all_media', 'moderate_comments', 'delete_comments', 'view_analytics', 'view_profile', 'edit_own_profile', 'access_dashboard'],
        level: 6
      },
      {
        name: 'admin',
        displayName: 'Admin',
        description: 'Full access to content, users, and site settings',
        permissions: ['view_posts', 'create_posts', 'edit_all_posts', 'delete_all_posts', 'publish_posts', 'create_pages', 'edit_pages', 'delete_pages', 'manage_categories', 'manage_tags', 'upload_media', 'manage_all_media', 'moderate_comments', 'delete_comments', 'create_users', 'edit_users', 'delete_users', 'manage_roles', 'manage_settings', 'view_analytics', 'access_dashboard', 'manage_plugins', 'manage_themes'],
        level: 7
      },
      {
        name: 'super_admin',
        displayName: 'Super Admin',
        description: 'System-wide access for multi-tenant management',
        permissions: ['view_posts', 'create_posts', 'edit_all_posts', 'delete_all_posts', 'publish_posts', 'create_pages', 'edit_pages', 'delete_pages', 'manage_categories', 'manage_tags', 'upload_media', 'manage_all_media', 'moderate_comments', 'delete_comments', 'create_users', 'edit_users', 'delete_users', 'manage_roles', 'manage_settings', 'view_analytics', 'access_dashboard', 'manage_plugins', 'manage_themes', 'manage_sites'],
        level: 8
      }
    ];
    
    await Role.insertMany(roles);
    console.log('✅ Roles seeded successfully');
    
    return roles;
  } catch (error) {
    console.error('❌ Error seeding roles:', error);
    throw error;
  }
};

module.exports = { seedRoles };