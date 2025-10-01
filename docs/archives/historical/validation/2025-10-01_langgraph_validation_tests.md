# LangGraph Validation Tests

This document outlines the validation tests that should be performed after the LangGraph Server installation to ensure that all components are working correctly, including the MCP server integration.

## Test Categories

The validation tests are divided into the following categories:

1. **Basic Functionality Tests** - Verify that the core LangGraph Server functionality is working
2. **MCP Integration Tests** - Verify that the MCP server integration is working
3. **Persistence Tests** - Verify that the persistence layer is working
4. **Streaming Tests** - Verify that the streaming functionality is working
5. **Load Tests** - Verify that the system can handle a reasonable load

## Test Scripts

### 1. Basic Functionality Test

This test verifies that the core LangGraph Server functionality is working correctly.

```bash
#!/bin/bash
# basic_functionality_test.sh

echo "Running Basic Functionality Test..."

# 1. Check if the server is running
echo "Checking if the server is running..."
response=$(curl -s --request GET --url http://localhost:8000/ok)
if [[ $response == *"true"* ]]; then
  echo "Server is running."
else
  echo "Server is not running. Exiting."
  exit 1
fi

# 2. Create an assistant
echo "Creating an assistant..."
assistant_response=$(curl -s --request POST \
  --url http://localhost:8000/assistants \
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
  }')
assistant_id=$(echo $assistant_response | grep -o '"id":"[^"]*' | cut -d'"' -f4)
echo "Assistant created with ID: $assistant_id"

# 3. Create a thread
echo "Creating a thread..."
thread_response=$(curl -s --request POST \
  --url http://localhost:8000/threads \
  --header 'Content-Type: application/json' \
  --data "{
    \"assistant_id\": \"$assistant_id\"
  }")
thread_id=$(echo $thread_response | grep -o '"id":"[^"]*' | cut -d'"' -f4)
echo "Thread created with ID: $thread_id"

# 4. Create a run
echo "Creating a run..."
run_response=$(curl -s --request POST \
  --url http://localhost:8000/runs \
  --header 'Content-Type: application/json' \
  --data "{
    \"thread_id\": \"$thread_id\",
    \"assistant_id\": \"$assistant_id\",
    \"input\": {
      \"messages\": [
        {
          \"role\": \"user\",
          \"content\": \"Hello, world!\"
        }
      ]
    }
  }")
run_id=$(echo $run_response | grep -o '"id":"[^"]*' | cut -d'"' -f4)
echo "Run created with ID: $run_id"

# 5. Wait for the run to complete
echo "Waiting for the run to complete..."
status="in_progress"
while [[ $status == "in_progress" || $status == "queued" ]]; do
  sleep 2
  run_status_response=$(curl -s --request GET --url http://localhost:8000/runs/$run_id)
  status=$(echo $run_status_response | grep -o '"status":"[^"]*' | cut -d'"' -f4)
  echo "Current status: $status"
done

# 6. Check if the run completed successfully
if [[ $status == "completed" ]]; then
  echo "Run completed successfully."
  echo "Basic Functionality Test: PASSED"
else
  echo "Run failed with status: $status"
  echo "Basic Functionality Test: FAILED"
  exit 1
fi
```

### 2. MCP Integration Test

This test verifies that the MCP server integration is working correctly.

```bash
#!/bin/bash
# mcp_integration_test.sh

echo "Running MCP Integration Test..."

# 1. Check if the server is running
echo "Checking if the server is running..."
response=$(curl -s --request GET --url http://localhost:8000/ok)
if [[ $response == *"true"* ]]; then
  echo "Server is running."
else
  echo "Server is not running. Exiting."
  exit 1
fi

# 2. Create an assistant with MCP tools
echo "Creating an assistant with MCP tools..."
assistant_response=$(curl -s --request POST \
  --url http://localhost:8000/assistants \
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
  }')
assistant_id=$(echo $assistant_response | grep -o '"id":"[^"]*' | cut -d'"' -f4)
echo "Assistant created with ID: $assistant_id"

# 3. Create a thread
echo "Creating a thread..."
thread_response=$(curl -s --request POST \
  --url http://localhost:8000/threads \
  --header 'Content-Type: application/json' \
  --data "{
    \"assistant_id\": \"$assistant_id\"
  }")
thread_id=$(echo $thread_response | grep -o '"id":"[^"]*' | cut -d'"' -f4)
echo "Thread created with ID: $thread_id"

# 4. Create a run that uses an MCP tool
echo "Creating a run that uses an MCP tool..."
run_response=$(curl -s --request POST \
  --url http://localhost:8000/runs \
  --header 'Content-Type: application/json' \
  --data "{
    \"thread_id\": \"$thread_id\",
    \"assistant_id\": \"$assistant_id\",
    \"input\": {
      \"messages\": [
        {
          \"role\": \"user\",
          \"content\": \"Echo this message: Hello from MCP!\"
        }
      ]
    }
  }")
run_id=$(echo $run_response | grep -o '"id":"[^"]*' | cut -d'"' -f4)
echo "Run created with ID: $run_id"

# 5. Wait for the run to complete
echo "Waiting for the run to complete..."
status="in_progress"
while [[ $status == "in_progress" || $status == "queued" ]]; do
  sleep 2
  run_status_response=$(curl -s --request GET --url http://localhost:8000/runs/$run_id)
  status=$(echo $run_status_response | grep -o '"status":"[^"]*' | cut -d'"' -f4)
  echo "Current status: $status"
done

# 6. Check if the run completed successfully and used the MCP tool
if [[ $status == "completed" ]]; then
  echo "Run completed successfully."
  
  # Check if the MCP tool was used
  run_details=$(curl -s --request GET --url http://localhost:8000/runs/$run_id)
  if [[ $run_details == *"echo"* && $run_details == *"Hello from MCP"* ]]; then
    echo "MCP tool was used successfully."
    echo "MCP Integration Test: PASSED"
  else
    echo "MCP tool was not used."
    echo "MCP Integration Test: FAILED"
    exit 1
  fi
else
  echo "Run failed with status: $status"
  echo "MCP Integration Test: FAILED"
  exit 1
fi
```

### 3. Persistence Test

This test verifies that the persistence layer is working correctly.

```bash
#!/bin/bash
# persistence_test.sh

echo "Running Persistence Test..."

# 1. Create an assistant
echo "Creating an assistant..."
assistant_response=$(curl -s --request POST \
  --url http://localhost:8000/assistants \
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
  }')
assistant_id=$(echo $assistant_response | grep -o '"id":"[^"]*' | cut -d'"' -f4)
echo "Assistant created with ID: $assistant_id"

# 2. Create a thread
echo "Creating a thread..."
thread_response=$(curl -s --request POST \
  --url http://localhost:8000/threads \
  --header 'Content-Type: application/json' \
  --data "{
    \"assistant_id\": \"$assistant_id\"
  }")
thread_id=$(echo $thread_response | grep -o '"id":"[^"]*' | cut -d'"' -f4)
echo "Thread created with ID: $thread_id"

# 3. Create a run with a message
echo "Creating a run with a message..."
run_response=$(curl -s --request POST \
  --url http://localhost:8000/runs \
  --header 'Content-Type: application/json' \
  --data "{
    \"thread_id\": \"$thread_id\",
    \"assistant_id\": \"$assistant_id\",
    \"input\": {
      \"messages\": [
        {
          \"role\": \"user\",
          \"content\": \"Remember this: The sky is blue.\"
        }
      ]
    }
  }")
run_id=$(echo $run_response | grep -o '"id":"[^"]*' | cut -d'"' -f4)
echo "Run created with ID: $run_id"

# 4. Wait for the run to complete
echo "Waiting for the run to complete..."
status="in_progress"
while [[ $status == "in_progress" || $status == "queued" ]]; do
  sleep 2
  run_status_response=$(curl -s --request GET --url http://localhost:8000/runs/$run_id)
  status=$(echo $run_status_response | grep -o '"status":"[^"]*' | cut -d'"' -f4)
  echo "Current status: $status"
done

# 5. Restart the containers
echo "Restarting the containers..."
docker-compose down
docker-compose up -d

# 6. Wait for the server to come back up
echo "Waiting for the server to come back up..."
sleep 10

# 7. Check if the thread still exists
echo "Checking if the thread still exists..."
thread_response=$(curl -s --request GET --url http://localhost:8000/threads/$thread_id)
if [[ $thread_response == *"$thread_id"* ]]; then
  echo "Thread still exists."
else
  echo "Thread does not exist. Persistence test failed."
  echo "Persistence Test: FAILED"
  exit 1
fi

# 8. Create a new run referencing the previous information
echo "Creating a new run referencing the previous information..."
run_response=$(curl -s --request POST \
  --url http://localhost:8000/runs \
  --header 'Content-Type: application/json' \
  --data "{
    \"thread_id\": \"$thread_id\",
    \"assistant_id\": \"$assistant_id\",
    \"input\": {
      \"messages\": [
        {
          \"role\": \"user\",
          \"content\": \"What did I ask you to remember?\"
        }
      ]
    }
  }")
run_id=$(echo $run_response | grep -o '"id":"[^"]*' | cut -d'"' -f4)
echo "Run created with ID: $run_id"

# 9. Wait for the run to complete
echo "Waiting for the run to complete..."
status="in_progress"
while [[ $status == "in_progress" || $status == "queued" ]]; do
  sleep 2
  run_status_response=$(curl -s --request GET --url http://localhost:8000/runs/$run_id)
  status=$(echo $run_status_response | grep -o '"status":"[^"]*' | cut -d'"' -f4)
  echo "Current status: $status"
done

# 10. Check if the run completed successfully and remembered the information
if [[ $status == "completed" ]]; then
  echo "Run completed successfully."
  
  # Check if the information was remembered
  run_details=$(curl -s --request GET --url http://localhost:8000/runs/$run_id)
  if [[ $run_details == *"sky is blue"* ]]; then
    echo "Information was remembered correctly."
    echo "Persistence Test: PASSED"
  else
    echo "Information was not remembered."
    echo "Persistence Test: FAILED"
    exit 1
  fi
else
  echo "Run failed with status: $status"
  echo "Persistence Test: FAILED"
  exit 1
fi
```

### 4. Streaming Test

This test verifies that the streaming functionality is working correctly.

```bash
#!/bin/bash
# streaming_test.sh

echo "Running Streaming Test..."

# 1. Create an assistant
echo "Creating an assistant..."
assistant_response=$(curl -s --request POST \
  --url http://localhost:8000/assistants \
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
  }')
assistant_id=$(echo $assistant_response | grep -o '"id":"[^"]*' | cut -d'"' -f4)
echo "Assistant created with ID: $assistant_id"

# 2. Create a thread
echo "Creating a thread..."
thread_response=$(curl -s --request POST \
  --url http://localhost:8000/threads \
  --header 'Content-Type: application/json' \
  --data "{
    \"assistant_id\": \"$assistant_id\"
  }")
thread_id=$(echo $thread_response | grep -o '"id":"[^"]*' | cut -d'"' -f4)
echo "Thread created with ID: $thread_id"

# 3. Create a run
echo "Creating a run..."
run_response=$(curl -s --request POST \
  --url http://localhost:8000/runs \
  --header 'Content-Type: application/json' \
  --data "{
    \"thread_id\": \"$thread_id\",
    \"assistant_id\": \"$assistant_id\",
    \"input\": {
      \"messages\": [
        {
          \"role\": \"user\",
          \"content\": \"Write a long response about artificial intelligence.\"
        }
      ]
    }
  }")
run_id=$(echo $run_response | grep -o '"id":"[^"]*' | cut -d'"' -f4)
echo "Run created with ID: $run_id"

# 4. Stream the run output
echo "Streaming the run output..."
curl -N --request GET --url http://localhost:8000/runs/$run_id/stream > stream_output.txt &
stream_pid=$!

# 5. Wait for a few seconds to collect some streaming data
echo "Waiting for streaming data..."
sleep 10

# 6. Kill the streaming process
kill $stream_pid

# 7. Check if streaming data was received
if [[ -s stream_output.txt ]]; then
  echo "Streaming data was received."
  echo "Streaming Test: PASSED"
else
  echo "No streaming data was received."
  echo "Streaming Test: FAILED"
  exit 1
fi

# Clean up
rm stream_output.txt
```

## Running the Tests

To run all the validation tests, execute the following commands:

```bash
# Make the test scripts executable
chmod +x basic_functionality_test.sh
chmod +x mcp_integration_test.sh
chmod +x persistence_test.sh
chmod +x streaming_test.sh

# Run the tests
./basic_functionality_test.sh
./mcp_integration_test.sh
./persistence_test.sh
./streaming_test.sh
```

## Test Results Summary

After running all the tests, summarize the results in the following format:

```
Test Results Summary:
- Basic Functionality Test: [PASSED/FAILED]
- MCP Integration Test: [PASSED/FAILED]
- Persistence Test: [PASSED/FAILED]
- Streaming Test: [PASSED/FAILED]

Overall Status: [PASSED/FAILED]
```

If any of the tests fail, investigate the failure and fix the issue before proceeding.