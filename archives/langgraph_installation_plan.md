# LangGraph Docker Installation Project Plan

## Overview

This document outlines the comprehensive plan for installing and configuring LangGraph using Docker, including the setup of an MCP server, proper endpoint exposure, and validation testing. This plan is designed to be implemented by the Code agent.

## Project Milestones

### Milestone 1: Environment Setup and Prerequisites

**Tasks:**
1. Install required CLI tools:
   - Node.js and npm (for LangGraph.js CLI)
   - Docker and Docker Compose
   - Python and pip (for MCP server if needed)

2. Verify system requirements:
   - Docker daemon running
   - Sufficient disk space for containers (at least 2GB free)
   - Required ports available:
     - Port 8000: LangGraph API server (configurable in docker-compose.yml)
     - Port 5432: PostgreSQL database
     - Port 6379: Redis (not exposed by default, but used internally)

3. Port verification process:
   ```bash
   # Check if ports are in use
   echo "Checking if port 8000 is available..."
   if lsof -i :8000 > /dev/null 2>&1; then
     echo "Port 8000 is already in use. Please free this port before proceeding."
     exit 1
   else
     echo "Port 8000 is available."
   fi

   echo "Checking if port 5432 is available..."
   if lsof -i :5432 > /dev/null 2>&1; then
     echo "Port 5432 is already in use. This may conflict with PostgreSQL."
     echo "You can either free this port or modify the docker-compose.yml to use a different port."
     exit 1
   else
     echo "Port 5432 is available."
   fi
   
   echo "All required ports are available."
   ```

3. Set up project directory structure:
   ```
   langgraph-project/
   ├── src/                # Application code
   ├── docker/             # Docker configuration files
   ├── config/             # Configuration files
   └── tests/              # Validation tests
   ```

### Milestone 2: LangGraph Application Configuration

**Tasks:**
1. Create a basic LangGraph application:
   - Define a simple agent graph
   - Set up necessary dependencies

2. Create `langgraph.json` configuration file:
   ```json
   {
     "dependencies": [
       "."
     ],
     "graphs": {
       "demo_agent": "./src/agent.js:agent"
     },
     "env": "./.env"
   }
   ```

3. Create `.env` file with required environment variables:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```

4. Create `package.json` with required dependencies:
   ```json
   {
     "name": "langgraph-demo",
     "version": "1.0.0",
     "dependencies": {
       "@langchain/langgraph": "latest",
       "@langchain/core": "latest"
     }
   }
   ```

### Milestone 3: Docker Configuration

**Tasks:**
1. Create Docker Compose file for required services:
   ```yaml
   version: "3"
   volumes:
     langgraph-data:
       driver: local
   services:
     langgraph-redis:
       image: redis:6
       healthcheck:
         test: redis-cli ping
         interval: 5s
         timeout: 1s
         retries: 5
     langgraph-postgres:
       image: postgres:16
       ports:
         - "5432:5432"
       environment:
         POSTGRES_DB: postgres
         POSTGRES_USER: postgres
         POSTGRES_PASSWORD: postgres
       volumes:
         - langgraph-data:/var/lib/postgresql/data
       healthcheck:
         test: pg_isready -U postgres
         start_period: 10s
         timeout: 1s
         retries: 5
         interval: 5s
     langgraph-api:
       image: ${IMAGE_NAME}
       ports:
         - "8000:8000"
       depends_on:
         langgraph-redis:
           condition: service_healthy
         langgraph-postgres:
           condition: service_healthy
       environment:
         REDIS_URI: redis://langgraph-redis:6379
         DATABASE_URI: postgres://postgres:postgres@langgraph-postgres:5432/postgres?sslmode=disable
         LANGSMITH_API_KEY: ${LANGSMITH_API_KEY}
   ```

2. Build LangGraph Docker image using CLI:
   ```bash
   npm install -g @langchain/langgraph-cli
   langgraph build -t langgraph-demo
   ```

### Milestone 4: MCP Server Integration

**Tasks:**
1. Create MCP server configuration:
   ```typescript
   // src/mcp-server.js
   import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
   import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
   import { z } from "zod";

   const server = new McpServer({
     name: "demo-server",
     version: "0.1.0"
   });

   // Add a simple tool
   server.tool(
     "echo",
     {
       message: z.string().describe("Message to echo"),
     },
     async ({ message }) => {
       return {
         content: [
           {
             type: "text",
             text: `Echo: ${message}`,
           },
         ],
       };
     }
   );

   // Start receiving messages on stdin and sending messages on stdout
   const transport = new StdioServerTransport();
   await server.connect(transport);
   console.error('MCP server running on stdio');
   ```

2. Configure MCP server in LangGraph:
   ```typescript
   // src/agent.js
   import { MultiServerMCPClient } from "@langchain/mcp-adapters";
   import { initChatModel } from "langchain/chat_models/universal";
   import { createReactAgent } from "@langchain/langgraph/prebuilt";

   const client = new MultiServerMCPClient({
     mcpServers: {
       "demo": {
         command: "node",
         args: ["./src/mcp-server.js"],
         transport: "stdio",
       }
     }
   });

   export const agent = async () => {
     const llm = await initChatModel("openai:gpt-3.5-turbo");
     return createReactAgent({
       llm,
       tools: await client.getTools()
     });
   };
   ```

### Milestone 5: Deployment and Validation

**Tasks:**
1. Deploy the Docker containers:
   ```bash
   export IMAGE_NAME=langgraph-demo
   export LANGSMITH_API_KEY=your_langsmith_api_key
   docker-compose up -d
   ```

2. Verify endpoint exposure:
   - Test the health endpoint: `curl http://localhost:8000/ok`
   - Test the assistants endpoint: `curl http://localhost:8000/assistants`

3. Perform validation tests:
   - Create a test script to verify MCP tool functionality
   - Test persistence with thread creation and retrieval
   - Test streaming capabilities

4. Create monitoring dashboard:
   - Set up basic monitoring for container health
   - Configure logging for troubleshooting

## Endpoint Verification Checklist

- [ ] `/ok` - Health check endpoint
- [ ] `/assistants` - List all assistants
- [ ] `/assistants/{assistant_id}` - Get assistant details
- [ ] `/threads` - Create and list threads
- [ ] `/threads/{thread_id}` - Get thread details
- [ ] `/runs` - Create and list runs
- [ ] `/runs/{run_id}` - Get run details
- [ ] `/store` - Access key-value store

## Validation Test Scenarios

1. **Basic Functionality Test**
   - Create an assistant
   - Create a thread
   - Run the assistant on the thread
   - Verify the response

2. **MCP Tool Integration Test**
   - Create an assistant with MCP tools
   - Run a query that requires using the MCP tool
   - Verify the tool was called correctly

3. **Persistence Test**
   - Create a thread with multiple messages
   - Restart the containers
   - Verify the thread state is preserved

4. **Streaming Test**
   - Create a streaming run
   - Verify events are streamed correctly

## Troubleshooting Guide

Common issues and their solutions:

1. **Container fails to start**
   - Check Docker logs: `docker logs <container_id>`
   - Verify environment variables are set correctly
   - Ensure ports are not already in use

2. **Database connection issues**
   - Verify PostgreSQL container is healthy
   - Check connection string format
   - Ensure database user has correct permissions

3. **MCP server integration issues**
   - Verify MCP server is running
   - Check tool definitions
   - Ensure proper transport configuration

## Resources

- [LangGraph Documentation](https://langchain-ai.github.io/langgraphjs/)
- [Docker Documentation](https://docs.docker.com/)
- [MCP Protocol Documentation](https://modelcontextprotocol.io/introduction)