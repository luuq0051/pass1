/**
 * Memory Safe Guard - Backend API Server
 * Express.js server với NeonDB PostgreSQL integration
 * Refactored với improved architecture và error handling
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import các modules đã refactor
import { DatabaseManager } from './db/database-manager.js';
import { PasswordController } from './controllers/password-controller.js';
import { ResponseHelper } from './utils/response-helper.js';
import { Logger } from './utils/logger.js';
import { AppError } from './utils/app-error.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const app = express();
const PORT = process.env.PORT || 3001;
const logger = new Logger('Server');

// Initialize database
const dbManager = DatabaseManager.getInstance();

// Initialize controllers
const passwordController = new PasswordController();

// Middleware
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    logger.logRequest(req, res, responseTime);
  });
  
  next();
});

// API Routes với improved error handling

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const healthStatus = await dbManager.healthCheck();
    
    if (healthStatus.status === 'healthy') {
      return ResponseHelper.success(res, healthStatus, 'System is healthy');
    } else {
      return ResponseHelper.error(res, new AppError('System is unhealthy', 503));
    }
  } catch (error) {
    logger.error('Health check failed', error);
    return ResponseHelper.error(res, error);
  }
});

// Password management routes
app.get('/api/passwords', passwordController.getPasswords.bind(passwordController));
app.post('/api/passwords', passwordController.createPassword.bind(passwordController));
app.put('/api/passwords/:id', passwordController.updatePassword.bind(passwordController));
app.delete('/api/passwords/:id', passwordController.deletePassword.bind(passwordController));
app.get('/api/passwords/stats', passwordController.getStats.bind(passwordController));

// 404 handler cho unknown routes
app.use('*', (req, res) => {
  ResponseHelper.notFound(res, `Route ${req.method} ${req.originalUrl} not found`);
});

// Global error handling middleware
app.use((error, req, res, next) => {
  logger.error('Unhandled error in request', error, {
    method: req.method,
    url: req.url,
    body: req.body,
    params: req.params,
    query: req.query
  });
  
  ResponseHelper.error(res, error);
});

// Initialize server
async function startServer() {
  try {
    // Initialize database connection
    await dbManager.initialize();
    
    // Start HTTP server
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Memory Safe Guard API Server running on port ${PORT}`, {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        healthCheck: `http://localhost:${PORT}/api/health`
      });
    });

    // Graceful shutdown handlers
    const gracefulShutdown = async (signal) => {
      logger.info(`📡 Received ${signal}, starting graceful shutdown...`);
      
      server.close(async () => {
        logger.info('🔌 HTTP server closed');
        
        try {
          await dbManager.close();
          logger.info('💾 Database connections closed');
          logger.info('✅ Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          logger.error('❌ Error during graceful shutdown', error);
          process.exit(1);
        }
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('💥 Uncaught Exception', error);
      process.exit(1);
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('💥 Unhandled Rejection', reason, { promise });
      process.exit(1);
    });
    
  } catch (error) {
    logger.error('❌ Failed to start server', error);
    process.exit(1);
  }
}

// Start the server
startServer();