# Stage 1: Build the React Application
FROM node:18-alpine AS builder

WORKDIR /app

# Accept build-time env vars (Vite embeds these at build time)
ARG VITE_BASE_URL=http://localhost:3000
ARG VITE_TMDB_IMAGE_BASE_URL
ARG VITE_CLERK_PUBLISHABLE_KEY
ARG VITE_STRIPE_PUBLIC_KEY

ENV VITE_BASE_URL=$VITE_BASE_URL
ENV VITE_TMDB_IMAGE_BASE_URL=$VITE_TMDB_IMAGE_BASE_URL
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_STRIPE_PUBLIC_KEY=$VITE_STRIPE_PUBLIC_KEY

# Copy .npmrc for legacy-peer-deps support
COPY .npmrc ./

# Install dependencies
COPY package*.json ./
RUN npm install

# Build application
COPY . .
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

# Copy the build output from Stage 1 to Nginx default html folder
COPY --from=builder /app/dist /usr/share/nginx/html

# Overwrite Nginx default conf with custom configuration for SPA proxy rules
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
