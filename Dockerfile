# ---- Stage 1: build the frontend ----
FROM node:22 AS build
WORKDIR /app

# Skip Electron's binary download: it is a devDependency only needed for
# the desktop app, not for building the web frontend.
ENV ELECTRON_SKIP_BINARY_DOWNLOAD=1

COPY package.json package-lock.json ./
COPY server/package.json server/package.json
RUN npm ci

COPY . .
RUN npm run build

# ---- Stage 2: production image ----
FROM node:22
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY server/package.json server/package.json
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
COPY server ./server

EXPOSE 3001
CMD ["npm", "start"]