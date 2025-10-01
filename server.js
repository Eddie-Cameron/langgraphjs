import express from 'express';
import pg from 'pg';
import redis from 'redis';
import { promisify } from 'util';

const app = express();
const port = process.env.PORT || 8000;

// Database client
const dbClient = new pg.Client({
  host: 'host.docker.internal', // Special Docker DNS name to reach host
  port: 5432,                   // Host port for Postgres (Supabase uses 5432 internally)
  database: 'langgraph',
  user: 'postgres',
  password: 'postgres'
});

// Redis client
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://langgraph-redis:6379',  // Use the Redis container name
});

// Connect to Redis
redisClient.on('error', (err) => console.log('Redis Client Error', err));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Database health check endpoint
app.get('/health/db', async (req, res) => {
  try {
    // Connect to the database if not already connected
    if (!dbClient.connected) {
      await dbClient.connect();
    }
    
    // Run a simple query to check connectivity
    const result = await dbClient.query('SELECT NOW()');
    
    // The assignments table already exists with columns:
    // id, created_at, user_id, team_id, graph_id, goal, params, status
    
    // Generate a UUID for our test
    const testUUID = '00000000-0000-0000-0000-000000000001';
    
    // Insert a test record
    await dbClient.query(`
      INSERT INTO assignments (id, goal, status, user_id, team_id, graph_id, params)
      VALUES ($1, 'verification_test', 'completed', 'test_user', 'test_team', 'test_graph', '{}')
      ON CONFLICT (id)
      DO UPDATE SET goal = 'verification_test', status = 'completed'
    `, [testUUID]);
    
    // Query it back
    const assignmentResult = await dbClient.query(`
      SELECT * FROM assignments WHERE id = $1
    `, [testUUID]);
    
    res.json({
      status: 'ok',
      timestamp: result.rows[0].now,
      database: 'connected',
      schema_test: {
        table: 'assignments',
        record: assignmentResult.rows[0]
      }
    });
  } catch (error) {
    console.error('Database health check failed:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
      database: 'connection failed'
    });
  }
});

// Redis health check endpoint
app.get('/health/redis', async (req, res) => {
  try {
    // Connect to Redis if not already connected
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
    
    // Set a test key
    const testKey = 'health_check:test';
    const testValue = 'ok';
    
    await redisClient.set(testKey, testValue);
    
    // Get the test key back
    const retrievedValue = await redisClient.get(testKey);
    
    res.json({
      status: 'ok',
      redis: 'connected',
      test: {
        key: testKey,
        expectedValue: testValue,
        actualValue: retrievedValue,
        match: testValue === retrievedValue
      }
    });
  } catch (error) {
    console.error('Redis health check failed:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
      redis: 'connection failed'
    });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`LangGraph API server listening on port ${port}`);
});

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  
  // Close database connection
  if (dbClient.connected) {
    await dbClient.end();
  }
  
  // Close Redis connection
  if (redisClient.connected) {
    await redisClient.quit();
  }
  
  process.exit(0);
});