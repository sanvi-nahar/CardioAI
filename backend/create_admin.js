// create_admin.js
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@hospital.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'pass123';
    
    const exists = await User.findOne({ email: adminEmail });
    if (exists) { 
      console.log('Admin already exists:', exists._id.toString()); 
      process.exit(0); 
    }
    
    const user = new User({ 
      name: 'Admin', 
      email: adminEmail, 
      password: adminPassword, 
      role: 'admin' 
    });
    await user.save();
    console.log('Created admin:', user._id.toString());
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('CREATE_ADMIN_ERROR', err && err.stack ? err.stack : err);
    process.exit(1);
  }
}
run();