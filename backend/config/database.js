const mysql = require('mysql2/promise');
require('dotenv').config();

// Create MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'codevimarsh',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Test connection
pool.getConnection()
  .then(connection => {
    console.log('✅ MySQL connected successfully');
    console.log('Database:', process.env.DB_NAME || 'codevimarsh');
    connection.release();
  })
  .catch(err => {
    console.error('❌ MySQL connection error:', err.message);
    console.error('Error code:', err.code);
    console.error('Please check:');
    console.error('1. MySQL service is running');
    console.error('2. Database name in .env: codevimarsh');
    console.error('3. Username and password in .env are correct');
    console.error('4. Database and tables are created');
  });

module.exports = pool;

