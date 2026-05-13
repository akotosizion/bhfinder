// scripts/setup-db.js
// Run with: node scripts/setup-db.js
// This creates the DB schema and seeds the admin account

const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function setup() {
  console.log('🔧 Setting up BH Finder database...');

  // Create tables
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(10) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  console.log('✅ users table ready');

  await sql`
    CREATE TABLE IF NOT EXISTS listings (
      id SERIAL PRIMARY KEY,
      title VARCHAR(200) NOT NULL,
      description TEXT,
      price VARCHAR(50),
      location VARCHAR(200),
      bedrooms INT DEFAULT 0,
      bathrooms INT DEFAULT 0,
      contact_number VARCHAR(20),
      amenities TEXT[],
      image_url TEXT,
      status VARCHAR(10) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
      user_id INT REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  // Add status column to existing listings table if missing
  await sql`ALTER TABLE listings ADD COLUMN IF NOT EXISTS status VARCHAR(10) DEFAULT 'active' CHECK (status IN ('active', 'inactive'))`;
  console.log('✅ listings table ready');

  await sql`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id SERIAL PRIMARY KEY,
      user_id INT REFERENCES users(id) ON DELETE CASCADE,
      token VARCHAR(255) UNIQUE NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      used BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  console.log('✅ password_reset_tokens table ready');

  // Seed admin account
  const adminEmail = 'admin@bhfinder.com';
  const existing = await sql`SELECT id FROM users WHERE email = ${adminEmail}`;

  if (existing.length === 0) {
    const passwordHash = await bcrypt.hash('admin123', 12);
    await sql`
      INSERT INTO users (username, email, password_hash, role)
      VALUES ('Admin', ${adminEmail}, ${passwordHash}, 'admin')
    `;
    console.log('✅ Admin account seeded:');
    console.log('   Email:    admin@bhfinder.com');
    console.log('   Password: admin123');
  } else {
    console.log('ℹ️  Admin account already exists, skipping seed');
  }

  console.log('\n🎉 Database setup complete!');
  process.exit(0);
}

setup().catch((err) => {
  console.error('❌ Setup failed:', err);
  process.exit(1);
});
