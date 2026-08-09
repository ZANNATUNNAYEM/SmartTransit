import mongoose from 'mongoose';
import { User } from '../models/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dns from 'dns';

// Force Google DNS for Atlas SRV resolution to prevent querySrv ECONNREFUSED error
dns.setServers(['8.8.8.8', '8.8.4.4']);

// Parse .env if process.env.MONGODB_URI is not set
let mongodbUri = process.env.MONGODB_URI;

if (!mongodbUri) {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const envPath = path.resolve(__dirname, '../.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const lines = envContent.split('\n');
      for (const line of lines) {
        const match = line.match(/^\s*MONGODB_URI\s*=\s*(.*)\s*$/);
        if (match) {
          mongodbUri = match[1].trim().replace(/^['"]|['"]$/g, '');
          break;
        }
      }
    }
  } catch (err) {
    console.warn('Could not read .env file:', err.message);
  }
}

const MONGODB_URI = mongodbUri || 'mongodb://localhost:27017/smarttransit';

async function seedAdmin() {
  if (MONGODB_URI.includes('<db_password>')) {
    console.error('\n[ERROR] Please replace "<db_password>" with your actual database password in the .env file before running this seeder.');
    process.exit(1);
  }

  console.log('Connecting to database...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB.');

  const adminEmail = 'zannatun.nayem@g.bracu.ac.bd';
  const adminPassword = 'admin'; // Plain text password for admin

  console.log(`Seeding Admin User (${adminEmail})...`);

  // Use updateOne with upsert to bypass the User model pre-save bcrypt hook,
  // matching how the admin authentication endpoint expects a plain text password.
  await User.updateOne(
    { email: adminEmail },
    {
      $set: {
        name: 'Super Admin',
        phone: '+8801711111111',
        password: adminPassword,
        role: 'admin',
        isApproved: true,
        status: 'active',
        isEmailVerified: true,
        emailVerifiedAt: new Date()
      }
    },
    { upsert: true }
  );

  console.log('Admin user seeded successfully!');
  console.log('--------------------------------------');
  console.log(`Email:    ${adminEmail}`);
  console.log(`Password: ${adminPassword}`);
  console.log('--------------------------------------');

  await mongoose.disconnect();
  console.log('Database connection closed.');
}

seedAdmin().catch((err) => {
  console.error('Error seeding admin user:', err);
  process.exit(1);
});
