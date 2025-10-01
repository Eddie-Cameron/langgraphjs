# Docker Compose Modifications Plan

## Current Issue

The current `docker-compose.yml` file in the langgraph-demo directory has a PostgreSQL container that conflicts with the existing `supabase-langgraph` container. According to the cleanup recommendations, we need to:

1. Fix the PostgreSQL port conflict
2. Add resource limits to Docker containers
3. Implement non-root user for Docker containers
4. Set up network isolation for Docker containers

## Solution

Since we've decided to use only the `supabase-langgraph` container and not run both containers simultaneously, we'll modify the `docker-compose.yml` file to:

1. Remove the PostgreSQL container entirely
2. Configure the LangGraph API to use the existing supabase-langgraph PostgreSQL instance
3. Add resource limits to the remaining containers
4. Implement non-root user for security
5. Set up network isolation

## Detailed Changes

### 1. Remove PostgreSQL Container and Update Connection

```yaml
# REMOVE this entire section
langgraph-postgres:
  image: postgres:16
  ports:
    - "5433:5432"
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
```

Update the LangGraph API service to connect to the supabase-langgraph PostgreSQL:

```yaml
langgraph-api:
  # ...
  environment:
    REDIS_URI: redis://langgraph-redis:6379
    # Update this line to point to the supabase-langgraph PostgreSQL
    POSTGRES_URI: postgres://postgres:postgres@host.docker.internal:5433/postgres?sslmode=disable
    # ...
```

### 2. Add Resource Limits

Add resource limits to the Redis container:

```yaml
langgraph-redis:
  # ...
  mem_limit: "512m"
  cpus: 0.3
```

Add resource limits to the LangGraph API container:

```yaml
langgraph-api:
  # ...
  mem_limit: "1.5g"
  cpus: 1.0
```

### 3. Implement Non-Root User

Add user configuration to run containers with non-root users:

```yaml
langgraph-redis:
  # ...
  user: "999:999"  # Redis typically uses this UID/GID

langgraph-api:
  # ...
  user: "1000:1000"  # Standard non-root user
```

### 4. Set Up Network Isolation

Create a dedicated network for the LangGraph services:

```yaml
networks:
  langgraph-network:
    driver: bridge
    internal: false  # Set to true for complete isolation, but we need external access

services:
  langgraph-redis:
    # ...
    networks:
      - langgraph-network

  langgraph-api:
    # ...
    networks:
      - langgraph-network
    # Add this to allow connection to host.docker.internal
    extra_hosts:
      - "host.docker.internal:host-gateway"
```

## Complete Modified docker-compose.yml

```yaml
version: "3"
volumes:
  langgraph-data:
    driver: local
networks:
  langgraph-network:
    driver: bridge
services:
  langgraph-redis:
    image: redis:6
    healthcheck:
      test: redis-cli ping
      interval: 5s
      timeout: 1s
      retries: 5
    mem_limit: "512m"
    cpus: 0.3
    user: "999:999"
    networks:
      - langgraph-network
  langgraph-api:
    image: langgraph-demo-image
    ports:
      - "8123:8000"
    depends_on:
      langgraph-redis:
        condition: service_healthy
    environment:
      REDIS_URI: redis://langgraph-redis:6379
      POSTGRES_URI: postgres://postgres:postgres@host.docker.internal:5433/postgres?sslmode=disable
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      LANGSMITH_API_KEY: ${LANGSMITH_API_KEY}
    mem_limit: "1.5g"
    cpus: 1.0
    user: "1000:1000"
    networks:
      - langgraph-network
    extra_hosts:
      - "host.docker.internal:host-gateway"
```

## Implementation Steps

1. Switch to Code mode to edit the docker-compose.yml file
2. Apply the changes outlined above
3. Test the configuration by running:
   ```bash
   cd langgraph-demo
   docker-compose down
   docker-compose up -d
   ```
4. Verify that the LangGraph API can connect to the supabase-langgraph PostgreSQL instance
5. Update the to-do list to mark the tasks as completed