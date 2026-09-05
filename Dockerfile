# ---- Stage 1: build the frontend ----
FROM node:22-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY server/package.json server/package.json
RUN npm ci

COPY . .
RUN npm run build

# ---- Stage 2: production image ----
FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY server/package.json server/package.json
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
COPY server ./server

EXPOSE 3001
CMD ["npm", "start"]