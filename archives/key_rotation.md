# API Key Rotation Policy

This document outlines the policy and procedures for rotating API keys and other sensitive credentials used in the LangGraph infrastructure.

## Rotation Schedule

| Credential Type | Environment | Rotation Frequency |
|-----------------|-------------|-------------------|
| API Keys (OpenAI, Anthropic, Google) | Development | Every 90 days |
| API Keys (OpenAI, Anthropic, Google) | Staging | Every 60 days |
| API Keys (OpenAI, Anthropic, Google) | Production | Every 30 days |
| Database Passwords | All | Every 90 days |
| JWT Secrets | All | Every 180 days |
| Service Role Keys | All | Every 60 days |

## Rotation Procedure

### For API Keys (OpenAI, Anthropic, Google)

1. Generate new API keys from the respective provider's dashboard
2. Update the appropriate `.env` file with the new keys
3. Restart the affected services
4. Verify functionality with the new keys
5. Revoke the old keys from the provider's dashboard

### For Database Passwords

1. Run the `set_postgres_password.sql` script with a new strong password
2. Update the password in the appropriate `.env` file
3. Restart the affected services
4. Verify database connectivity

### For JWT Secrets and Service Role Keys

1. Generate new secure random strings for these secrets
2. Update the appropriate `.env` file with the new secrets
3. Restart the affected services
4. Verify authentication functionality

## Emergency Rotation

In case of a suspected security breach or unauthorized access:

1. Immediately rotate all credentials for the affected environment
2. Conduct a security audit to identify the source of the breach
3. Implement additional security measures as needed
4. Consider rotating credentials for all environments as a precaution

## Documentation

Each rotation should be documented with:

- Date and time of rotation
- Credentials rotated (without including the actual values)
- Person responsible for the rotation
- Verification that services are functioning correctly after rotation

## Automation

Consider implementing automated rotation using a secrets management service for production environments to reduce manual effort and increase security.