FROM node:22-alpine

WORKDIR /app

# Install curl for healthchecks
RUN apk add --no-cache curl

# Install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy server source
COPY server ./server

EXPOSE 8787
CMD ["node", "server/index.mjs"]
