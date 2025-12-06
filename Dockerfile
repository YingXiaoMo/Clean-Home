# Stage 1: Build Frontend
FROM node:lts-alpine as builder

WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build Vue app to /app/dist
RUN npm run build

# Stage 2: Serve with Node.js Express
FROM node:lts-alpine

WORKDIR /app

# Copy necessary files
COPY package*.json ./
COPY server.js ./

# Install production dependencies only (express, multer)
RUN npm install --production

# Copy built assets from builder stage
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3000

# Start server
CMD ["node", "server.js"]