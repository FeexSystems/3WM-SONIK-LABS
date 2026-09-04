# Stage 1: Build the application
FROM node:20-alpine AS builder
WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm ci

# Copy source and compile production bundles (client assets + bundled server.cjs)
COPY . .
RUN npm run build

# Stage 2: Production runner environment
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install only production dependencies to keep the image lightweight
COPY package*.json ./
RUN npm ci --only=production

# Copy compiled artifacts and static assets
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

# Expose port and start Express engine
ENV PORT=8080
EXPOSE 8080
CMD ["node", "dist/server.cjs"]
