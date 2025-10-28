/**
 * Script: Chạy migration tạo bảng service_requests
 * Chạy: node scripts/run-service-migration.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Dùng DB_CONNECTION_STRING từ .env
const pool = new Pool({
  connectionString: process.env.DB_CONNECTION_STRING || 'postgres://postgres:1@localhost:5432/identity_db'
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('📦 Đang chạy migration: service_requests table...\n');
    
    // Đọc file SQL
    const sqlPath = path.join(__dirname, 'migrate-service-requests.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Thực thi migration
    await client.query(sql);
    
    console.log('✅ Migration hoàn tất!');
    console.log('   - Đã tạo bảng: service_requests');
    console.log('   - Đã tạo indexes: wallet, status, type, created_at');
    console.log('   - Đã tạo trigger: auto-update updated_at\n');
    
    // Kiểm tra bảng
    const checkQuery = `
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'service_requests'
      ORDER BY ordinal_position;
    `;
    const result = await client.query(checkQuery);
    
    console.log('📋 Schema của bảng service_requests:');
    console.log('┌─────────────────────────┬──────────────────┐');
    console.log('│ Column                  │ Type             │');
    console.log('├─────────────────────────┼──────────────────┤');
    result.rows.forEach(row => {
      console.log(`│ ${row.column_name.padEnd(23)} │ ${row.data_type.padEnd(16)} │`);
    });
    console.log('└─────────────────────────┴──────────────────┘\n');
    
  } catch (error) {
    console.error('❌ Migration thất bại:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
