/**
 * One-time script to seed the first admin user into the database.
 * Run with: node seed-admin.js
 * After running, you can delete this file.
 */
const mongoose = require('mongoose');
const config = require('./src/config');
const User = require('./src/models/user.model');

async function seedAdmin() {
    try {
        await mongoose.connect(config.mongoURI);
        console.log('Connected to MongoDB.');

        const existingAdmin = await User.findOne({ email: 'admin@interview.com' });
        if (existingAdmin) {
            console.log('Admin user already exists. No action needed.');
            process.exit(0);
        }

        const admin = await User.create({
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@interview.com',
            password: 'Admin@1234',
            role: 'admin',
        });

        console.log('✅ Admin user created successfully!');
        console.log('   Email:    admin@interview.com');
        console.log('   Password: Admin@1234');
        console.log('   Role:     admin');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding admin:', error.message);
        process.exit(1);
    }
}

seedAdmin();
