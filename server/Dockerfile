FROM node:18-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy application source
COPY . .

# Build TypeScript to JS
RUN npm run build

# Expose the port from our backend
EXPOSE 3000

# Start server from the dist folder
CMD ["npm", "start"]
