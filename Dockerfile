# Build stage
FROM node:18-slim AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Production stage
FROM node:18-slim

WORKDIR /app

# Install 'serve' to serve the static build
RUN npm install -g serve

# Copy build from build stage
COPY --from=build /app/dist ./dist

# Expose port
EXPOSE 5173

# Serve the app
CMD ["serve", "-s", "dist", "-l", "5173"]
