/**
 * Simple Memory Safe Guard API Server
 * CommonJS version với NeonDB
 */

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const app = express();
const PORT = process.env.PORT || 3001;

// Database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Middleware
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:8081', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    
    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: result.rows[0].now
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message
    });
  }
});

// Get all passwords
app.get('/api/passwords', async (req, res) => {
  try {
    const { search } = req.query;
    let query = 'SELECT * FROM passwords ORDER BY updated_at DESC';
    let params = [];

    if (search) {
      query = `SELECT * FROM passwords WHERE service ILIKE $1 OR username ILIKE $1 ORDER BY updated_at DESC`;
      params = [`%${search}%`];
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching passwords:', error);
    res.status(500).json({ error: 'Failed to fetch passwords' });
  }
});

// Add new password
app.post('/api/passwords', async (req, res) => {
  try {
    const { service, username, password } = req.body;
    
    if (!service || !username || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const query = `INSERT INTO passwords (service, username, password, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING *`;
    const result = await pool.query(query, [service, username, password]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding password:', error);
    res.status(500).json({ error: 'Failed to add password' });
  }
});

// Update password
app.put('/api/passwords/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { service, username, password } = req.body;
    
    const query = `UPDATE passwords SET service = $1, username = $2, password = $3, updated_at = NOW() WHERE id = $4 RETURNING *`;
    const result = await pool.query(query, [service, username, password, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Password not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

// Delete password
app.delete('/api/passwords/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = 'DELETE FROM passwords WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Password not found' });
    }
    
    res.json({ message: 'Password deleted successfully' });
  } catch (error) {
    console.error('Error deleting password:', error);
    res.status(500).json({ error: 'Failed to delete password' });
  }
});

// Get password statistics
app.get('/api/passwords/stats', async (req, res) => {
  try {
    const query = 'SELECT COUNT(*) as total FROM passwords';
    const result = await pool.query(query);
    
    res.json({
      total: parseInt(result.rows[0].total),
      hasPasswords: parseInt(result.rows[0].total) > 0
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Memory Safe Guard API Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down server...');
  await pool.end();
  process.exit(0);
});