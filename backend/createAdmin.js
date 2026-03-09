/**
 * Script to create an admin user
 * 
 * Usage: node scripts/createAdmin.js
 * 
 * This script will:
 * 1. Connect to MongoDB
 * 2. Check if admin exists
 * 3. Create admin user or update existing user to admin
 */

const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');

    const adminEmail = 'admin@example.com';
    const adminPassword = 'admin123';

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists. Updating role to admin...');
      
      // Update role to admin
      existingAdmin.role = 'admin';
      await existingAdmin.save();
      
      console.log('✅ Admin role updated successfully!');
      console.log('\n📋 Admin Credentials:');
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Password: ${adminPassword}`);
      console.log('\n🔗 Login at: http://localhost:3000/login');
    } else {
      // Create admin user
      console.log('Creating admin user...');
      
      const admin = await User.create({
        fullName: 'Admin User',
        nicNumber: '123456789V',
        drivingLicense: 'DL123456',
        email: adminEmail,
        mobileNumber: '0771234567',
        password: adminPassword,
        role: 'admin',
      });

      console.log('✅ Admin created successfully!');
      console.log('\n📋 Admin Credentials:');
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Password: ${adminPassword}`);
      console.log('\n🔗 Login at: http://localhost:3000/login');
      console.log('   You will be redirected to: http://localhost:3000/admin/dashboard');
    }

    // Close connection
    await mongoose.connection.close();
    console.log('\n✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.code === 11000) {
      console.error('   Duplicate key error. User with this email, NIC, or DL already exists.');
      console.error('   Try using a different email or update existing user in MongoDB.');
    }
    
    process.exit(1);
  }
};

// Run the script
createAdmin();











