# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /usr/src/app

COPY package*.json ./
# Install dependencies
RUN npm install

COPY . .

# Stage 2: Production
FROM node:18-alpine
WORKDIR /usr/src/app

# SECURITY: Run as a non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

COPY --from=builder /usr/src/app .

EXPOSE 3000
CMD [ "npm", "start" ]