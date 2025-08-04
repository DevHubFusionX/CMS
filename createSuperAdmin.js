const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const dotenv = require('dotenv')
const User = require('./models/User')
const Role = require('./models/Role')

// Load env vars
dotenv.config()

// Connect to database
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI)
    console.log(`MongoDB Connected: ${conn.connection.host}`)
  } catch (error) {
    console.error('Database connection error:', error)
    process.exit(1)
  }
}

// Create super admin user
const createSuperAdmin = async () => {
  try {
    await connectDB()

    // Get super_admin role
    const superAdminRole = await Role.findOne({ name: 'super_admin' })
    if (!superAdminRole) {
      console.error('Super admin role not found. Run npm run seed:roles first.')
      process.exit(1)
    }

    // Check if super admin already exists
    const existingAdmin = await User.findOne({
      email: 'superadmin@HubFusionx.com'
    })
    if (existingAdmin) {
      console.log('Super admin already exists!')
      console.log('Email: superadmin@HubFusionx.com')
      console.log('Password: SuperAdmin123!')
      process.exit(0)
    }

    // Create super admin user
    const superAdmin = await User.create({
      name: 'Super Administrator',
      email: 'superadmin@HubFusionx.com',
      password: 'SuperAdmin123!',
      role: superAdminRole._id,
      legacyRole: 'super_admin',
      isActive: true
    })

    console.log('✅ Super admin created successfully!')
    console.log('📧 Email: superadmin@HubFusionx.com')
    console.log('🔑 Password: SuperAdmin123!')
    console.log('🎯 Role: Super Administrator')

    process.exit(0)
  } catch (error) {
    console.error('❌ Error creating super admin:', error)
    process.exit(1)
  }
}

createSuperAdmin()
