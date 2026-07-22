# syntax=docker/dockerfile:1

# ---- Stage 1: build the Vue frontend ----
FROM node:20-slim AS frontend
WORKDIR /app/frontend
COPY frontend/package.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# ---- Stage 2: build the Fastify backend ----
FROM node:20-slim AS backend
WORKDIR /app/backend
COPY backend/package.json ./
RUN npm install
COPY backend/ ./
RUN npm run build && npm prune --omit=dev

# ---- Stage 3: slim runtime ----
FROM node:20-slim AS runtime
ENV NODE_ENV=production \
    DATA_DIR=/data \
    STATIC_DIR=/app/frontend/dist \
    PORT=3000
WORKDIR /app

COPY --from=backend /app/backend/dist ./backend/dist
COPY --from=backend /app/backend/node_modules ./backend/node_modules
COPY --from=backend /app/backend/package.json ./backend/package.json
COPY --from=frontend /app/frontend/dist ./frontend/dist

# Persisted data (SQLite db + generated secrets) lives on a volume.
RUN mkdir -p /data && chown -R node:node /data
VOLUME /data
EXPOSE 3000
USER node
CMD ["node", "backend/dist/server.js"]
