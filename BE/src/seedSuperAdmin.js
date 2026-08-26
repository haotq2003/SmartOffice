const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('./models/User');

const seedSuperAdmin = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/smartoffice';
    console.log('Connecting to MongoDB:', mongoUri);
    await mongoose.connect(mongoUri);

    const email = 'superadmin@smartoffice.com';
    const password = 'superadmin123';
    const name = 'Super Admin Master';

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let superAdmin = await User.findOne({ email });

    if (superAdmin) {
      superAdmin.password = hashedPassword;
      superAdmin.role = 'super_admin';
      superAdmin.name = name;
      await superAdmin.save();
      console.log('✅ Super Admin account updated successfully!');
    } else {
      superAdmin = await User.create({
        name,
        email,
        password: hashedPassword,
        role: 'super_admin'
      });
      console.log('✅ Super Admin account created successfully!');
    }

    console.log('-----------------------------------');
    console.log('Super Admin Credentials for Login:');
    console.log('Email:    superadmin@smartoffice.com');
    console.log('Password: superadmin123');
    console.log('Role:     super_admin');
    console.log('-----------------------------------');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding Super Admin:', error);
    process.exit(1);
  }
};

seedSuperAdmin();
