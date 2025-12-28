// Quick database connection test
require('dotenv').config();
const mysql = require('mysql2/promise');

async function testConnection() {
  try {
    console.log('Testing database connection...');
    console.log('DB_HOST:', process.env.DB_HOST);
    console.log('DB_USER:', process.env.DB_USER);
    console.log('DB_NAME:', process.env.DB_NAME);
    console.log('DB_PORT:', process.env.DB_PORT);
    
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'codevimarsh',
      port: process.env.DB_PORT || 3306
    });

    console.log('✅ Database connection successful!');
    
    // Test query
    const [rows] = await connection.execute('SHOW TABLES');
    console.log('✅ Tables found:', rows.length);
    rows.forEach(row => {
      console.log('  -', Object.values(row)[0]);
    });
    
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed!');
    console.error('Error:', error.message);
    console.error('Error code:', error.code);
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('💡 Check your MySQL username and password in .env');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('💡 Database does not exist. Run the SQL setup script first.');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('💡 MySQL service is not running. Start MySQL service first.');
    }
    process.exit(1);
  }
}

testConnection();

