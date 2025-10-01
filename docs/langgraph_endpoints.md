# LangGraph Server Endpoints

This document outlines all the endpoints that need to be exposed and verified after the LangGraph Server installation. The Code agent should ensure that all these endpoints are properly configured and functioning.

## Core Endpoints

### Health Check
- **Endpoint**: `/ok`
- **Method**: GET
- **Description**: Verifies that the LangGraph Server is running properly
- **Expected Response**: `{"ok": true}`
- **Verification Command**:
  ```bash
  curl --request GET --url http://localhost:8123/ok
  ```

## Assistant Management

### List Assistants
- **Endpoint**: `/assistants`
- **Method**: GET
- **Description**: Lists all available assistants
- **Expected Response**: JSON array of assistant objects
- **Verification Command**:
  ```bash
  curl --request POST --url http://localhost:8123/assistants/search --header 'Content-Type: application/json' --data '{}'
  ```

### Get Assistant
- **Endpoint**: `/assistants/{assistant_id}`
- **Method**: POST (via `/assistants/search`)
- **Description**: Gets details of a specific assistant
- **Expected Response**: JSON object with assistant details
- **Verification Command**:
  ```bash
  curl --request GET --url http://localhost:8123/assistants/{assistant_id}
  ```

### Create Assistant
- **Endpoint**: `/assistants`
- **Method**: POST
- **Description**: Creates a new assistant
- **Expected Response**: JSON object with the created assistant details
- **Verification Command**:
  ```bash
  curl --request POST \
    --url http://localhost:8123/assistants \
    --header 'Content-Type: application/json' \
    --data '{
      "graph_id": "demo_agent",
      "config": {
        "configurable": {
          "llm": {
            "model": "gpt-3.5-turbo"
          }
        }
      }
    }'
  ```

## Thread Management

### List Threads
- **Endpoint**: `/threads`
- **Method**: POST (via `/threads/search`)
- **Description**: Lists all available threads
- **Expected Response**: JSON array of thread objects
- **Verification Command**:
  ```bash
  curl --request POST --url http://localhost:8123/threads/search --header 'Content-Type: application/json' --data '{}'
  ```

### Create Thread
- **Endpoint**: `/threads`
- **Method**: POST
- **Description**: Creates a new thread
- **Expected Response**: JSON object with the created thread details
- **Verification Command**:
  ```bash
  curl --request POST \
    --url http://localhost:8123/threads \
    --header 'Content-Type: application/json' \
    --data '{
      "assistant_id": "{assistant_id}"
    }'
  ```

### Get Thread
- **Endpoint**: `/threads/{thread_id}`
- **Method**: GET
- **Description**: Gets details of a specific thread
- **Expected Response**: JSON object with thread details
- **Verification Command**:
  ```bash
  curl --request GET --url http://localhost:8123/threads/{thread_id}
  ```

## Run Management

### Create Run
- **Endpoint**: `/runs`
- **Method**: POST
- **Description**: Creates a new run on a thread
- **Expected Response**: JSON object with the created run details
- **Verification Command**:
  ```bash
  curl --request POST \
    --url http://localhost:8123/runs \
    --header 'Content-Type: application/json' \
    --data '{
      "thread_id": "{thread_id}",
      "assistant_id": "{assistant_id}",
      "input": {
        "messages": [
          {
            "role": "user",
            "content": "Hello, world!"
          }
        ]
      }
    }'
  ```

### Get Run
- **Endpoint**: `/runs/{run_id}`
- **Method**: GET
- **Description**: Gets details of a specific run
- **Expected Response**: JSON object with run details
- **Verification Command**:
  ```bash
  curl --request GET --url http://localhost:8123/runs/{run_id}
  ```

### List Runs
- **Endpoint**: `/runs`
- **Method**: POST (via `/runs/search`)
- **Description**: Lists all runs
- **Expected Response**: JSON array of run objects
- **Verification Command**:
  ```bash
  curl --request POST --url http://localhost:8123/runs/search --header 'Content-Type: application/json' --data '{"thread_id": "{thread_id}"}'
  ```

## Streaming Endpoints

### Stream Run
- **Endpoint**: `/runs/{run_id}/stream`
- **Method**: GET
- **Description**: Streams the output of a run
- **Expected Response**: Server-sent events with run updates
- **Verification Command**:
  ```bash
  curl --request GET --url http://localhost:8123/runs/{run_id}/stream
  ```

## Memory Store

### Set Key-Value
- **Endpoint**: `/store`
- **Method**: POST
- **Description**: Sets a key-value pair in the memory store
- **Expected Response**: JSON object confirming the operation
- **Verification Command**:
  ```bash
  curl --request POST \
    --url http://localhost:8123/store \
    --header 'Content-Type: application/json' \
    --data '{
      "key": "test-key",
      "value": "test-value"
    }'
  ```

### Get Key-Value
- **Endpoint**: `/store/{key}`
- **Method**: GET
- **Description**: Gets a value from the memory store by key
- **Expected Response**: JSON object with the value
- **Verification Command**:
  ```bash
  curl --request GET --url http://localhost:8123/store/test-key
  ```

## MCP Integration Verification

To verify that the MCP server integration is working correctly, create a run that uses an MCP tool:

```bash
curl --request POST \
  --url http://localhost:8123/runs \
  --header 'Content-Type: application/json' \
  --data '{
    "thread_id": "{thread_id}",
    "assistant_id": "{assistant_id}",
    "input": {
      "messages": [
        {
          "role": "user",
          "content": "Echo this message: Hello from MCP!"
        }
      ]
    }
  }'
```

Then check the run output to verify that the MCP tool was called correctly:

```bash
curl --request GET --url http://localhost:8123/runs/{run_id}
```

## Endpoint Verification Checklist

The Code agent should use this checklist to verify that all endpoints are properly exposed and functioning:

- [ ] Health check endpoint (`/ok`)
- [ ] Assistant management endpoints
  - [ ] List assistants (`/assistants`)
  - [ ] Get assistant (`/assistants/{assistant_id}`)
  - [ ] Create assistant (`/assistants`)
- [ ] Thread management endpoints
  - [ ] List threads (`/threads`)
  - [ ] Get thread (`/threads/{thread_id}`)
  - [ ] Create thread (`/threads`)
- [ ] Run management endpoints
  - [ ] List runs (`/runs`)
  - [ ] Get run (`/runs/{run_id}`)
  - [ ] Create run (`/runs`)
- [ ] Streaming endpoints
  - [ ] Stream run (`/runs/{run_id}/stream`)
- [ ] Memory store endpoints
  - [ ] Set key-value (`/store`)
  - [ ] Get key-value (`/store/{key}`)
- [ ] MCP integration verification