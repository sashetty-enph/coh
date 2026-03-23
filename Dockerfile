# Use Node 20 (required for Vite 7 and Tailwind v4)
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (production only for runtime)
RUN npm ci

# Copy application code
COPY . .

# Build frontend
RUN npm run build

# Expose port for Express API
EXPOSE 3003

# Start only the Express server (frontend is served as static files)
CMD ["node", "server/index.js"]
