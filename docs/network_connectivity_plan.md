# Network Connectivity Plan

## Current Issues

1. The langgraph-api container cannot connect to the supabase-langgraph database container
2. The containers are on different Docker networks:
   - supabase-langgraph is on the default bridge network (172.17.0.2)
   - langgraph-api is on the langgraphjs_default network

## Solution Approach

We need to modify the database connection in the server.js file to connect to the database using the host machine as a bridge:

1. Update the database client configuration in server.js:
   ```javascript
   // Database client
   const dbClient = new pg.Client({
     host: 'host.docker.internal', // Special Docker DNS name to reach host
     port: 5433,                   // Host port mapped to Postgres
     database: 'langgraph',
     user: 'postgres',
     password: 'postgres'
   });
   ```

2. If 'host.docker.internal' doesn't work (depends on Docker version/setup), we can try:
   ```javascript
   // Database client
   const dbClient = new pg.Client({
     host: '172.17.0.1',  // Docker bridge gateway IP
     port: 5433,          // Host port mapped to Postgres
     database: 'langgraph',
     user: 'postgres',
     password: 'postgres'
   });
   ```

3. Alternatively, we can add the langgraph-api container to the bridge network by updating docker-compose.yml:
   ```yaml
   langgraph-api:
     # ... existing configuration ...
     network_mode: "bridge"  # Use the default bridge network
   ```

## Implementation Steps

1. Stop the current containers:
   ```
   docker-compose down
   ```

2. Update the server.js file with the new database connection configuration

3. Update the docker-compose.yml file if needed

4. Start the containers again:
   ```
   docker-compose up -d
   ```

5. Test the endpoints:
   ```
   curl http://localhost:8123/health
   curl http://localhost:8123/health/redis
   curl http://localhost:8123/health/db
   ```

## Expected Results

- The langgraph-api container should be able to connect to both Redis and the Postgres database
- The /health/db endpoint should return a successful response with database information
- The /health/redis endpoint should continue to work as before