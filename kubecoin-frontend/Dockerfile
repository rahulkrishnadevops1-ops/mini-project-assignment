# Stage 1: Build the React application
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files first for better caching
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the production bundle
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf 2>/dev/null || true

# Copy nginx config template
COPY nginx.conf.template /etc/nginx/nginx.conf.template

# Copy build artifacts from Stage 1
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 8080 (unprivileged)
EXPOSE 8080

# Backend URL - can be overridden at runtime
# This teaches students how frontend discovers backend service
ENV BACKEND_URL=http://backend:5000

# Copy and use a simple startup script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

CMD ["/docker-entrypoint.sh"]
