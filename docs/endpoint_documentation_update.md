# LangGraph Server Endpoint Documentation Update

This document provides an update to the LangGraph Server endpoint documentation to reflect the actual implementation.

## Port Configuration

The original documentation in `langgraph_endpoints.md` has been updated to reflect the correct port (8123) that the LangGraph Server is running on. The server was configured to use port 8123 instead of the default port 8000 due to port conflicts during installation.

## Endpoint Method Corrections

Several endpoints were documented with incorrect HTTP methods. The following corrections have been made:

1. **List Assistants**: 
   - Original: GET `/assistants`
   - Corrected: POST `/assistants/search`

2. **List Threads**:
   - Original: GET `/threads`
   - Corrected: POST `/threads/search`

3. **List Runs**:
   - Original: GET `/runs`
   - Corrected: POST `/runs/search`

## Validation Test Considerations

The validation test scripts in `langgraph_validation_tests.md` still reference the old port (8000) and incorrect endpoint methods. If you plan to run these tests, you should update the scripts to use:

1. The correct port (8123)
2. The correct endpoint methods (POST for search endpoints)

However, as these are historical validation tests, you may prefer to keep them as-is for record-keeping purposes and create new validation tests with the correct configuration.

## Next Steps

1. The `langgraph_endpoints.md` file has been updated with the correct port and endpoint methods.
2. Consider creating new validation test scripts that use the correct configuration if you need to run validation tests again.
3. Ensure any client applications or scripts that interact with the LangGraph Server use the correct port and endpoint methods.