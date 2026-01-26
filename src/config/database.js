const mysql = require('mysql2/promise');
const logger = require('../utils/logger');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'scancard',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
  charset: 'utf8mb4'
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

/**
 * Test database connection
 */
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    
    console.log('\n✅ DATABASE CONNECTED SUCCESSFULLY!');
    console.log(`   Host: ${dbConfig.host}`);
    console.log(`   Database: ${dbConfig.database}`);
    console.log(`   User: ${dbConfig.user}\n`);
    
    logger.info('Database connected successfully', {
      host: dbConfig.host,
      database: dbConfig.database
    });
    connection.release();
    return true;
  } catch (error) {
    console.error('\n❌ DATABASE CONNECTION FAILED!');
    console.error(`   Error: ${error.message}`);
    console.error(`   Host: ${dbConfig.host}`);
    console.error(`   Database: ${dbConfig.database}\n`);
    
    logger.error('Database connection failed:', error);
    return false;
  }
}

/**
 * Execute query with parameters
 */
async function query(sql, params = []) {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    logger.error('Database query error:', {
      sql: sql.substring(0, 100) + '...',
      error: error.message
    });
    throw error;
  }
}

/**
 * Execute query and return single row
 */
async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Check if record exists
 */
async function exists(sql, params = []) {
  const result = await queryOne(sql, params);
  return result !== null;
}

/**
 * Execute transaction
 */
async function transaction(callback) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Execute raw query (for migrations, etc.)
 */
async function execute(sql, params = []) {
  try {
    return await pool.execute(sql, params);
  } catch (error) {
    logger.error('Database execute error:', {
      sql: sql.substring(0, 100) + '...',
      error: error.message
    });
    throw error;
  }
}

// Test connection on startup
testConnection();

module.exports = {
  pool,
  query,
  queryOne,
  exists,
  transaction,
  execute,
  testConnection
};