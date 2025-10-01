# Use a specific Node.js version for security and stability
FROM node:20.11.1-alpine

# Create app directory
WORKDIR /app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Create a non-root user and set ownership
RUN addgroup -g 1001 -S appuser && \
    adduser -u 1001 -S appuser -G appuser && \
    chown -R appuser:appuser /app

# Set proper permissions for the application files
RUN chmod -R 755 /app

# Switch to non-root user
USER appuser

# Expose the application port
EXPOSE 8000

# Start the application
CMD ["node", "server.js"]