FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies for all project parts.
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/
RUN npm ci && npm ci --prefix client && npm ci --prefix server

# Build frontend assets consumed by Express in production.
COPY . .
RUN npm run build --prefix client

FROM node:20-alpine AS runtime
WORKDIR /app

RUN apk add --no-cache wget

COPY server/package*.json ./server/
RUN npm ci --omit=dev --prefix server

COPY --from=build /app/server ./server
COPY --from=build /app/client/dist ./client/dist

ENV NODE_ENV=production
ENV PORT=8000
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/api/health" || exit 1

CMD ["npm", "run", "start", "--prefix", "server"]
