# Use Node 20 (required for Vite 7 and Tailwind v4)
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application code
COPY . .

# Build frontend
RUN npm run build

# Expose ports
EXPOSE 5175 3003

# Start the application
CMD ["npm", "run", "dev"]
