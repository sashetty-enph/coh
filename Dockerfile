# Use Node 20 (required for Vite 7 and Tailwind v4)
FROM node:20-alpine

# Install build tools for native modules (better-sqlite3)
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies and rebuild native modules for Linux
RUN npm ci
RUN npm rebuild better-sqlite3

# Copy application code
COPY . .

# Build frontend
RUN npm run build

# Expose port for Express API
EXPOSE 3003

# Start only the Express server (frontend is served as static files)
CMD ["node", "server/index.js"]
