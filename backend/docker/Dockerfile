# =====================
# Stage 1: Development
# =====================
FROM node:22-alpine AS dev
WORKDIR /workspace

# Copy workspace package files
COPY package.json yarn.lock ./
COPY backend/package.json ./backend/

# Install all workspace dependencies
RUN yarn install --frozen-lockfile

# Set working directory to backend
WORKDIR /workspace/backend

# Expose backend port
EXPOSE 3000

# Start the development server with nodemon
CMD ["yarn", "dev"]

# =====================
# Stage 2: Production build
# =====================
FROM node:22-alpine AS build
WORKDIR /workspace

# Copy workspace package files
COPY package.json yarn.lock ./
COPY backend/package.json ./backend/

# Install ALL dependencies (including devDependencies for TypeScript)
RUN yarn install --frozen-lockfile

# Copy backend source code and config
COPY backend/tsconfig.json ./backend/
COPY backend/api ./backend/api

# Build TypeScript in backend directory
WORKDIR /workspace/backend
RUN yarn build:prod


# =====================
# Stage 3: Production runtime
# =====================
FROM node:22-alpine AS prod
WORKDIR /workspace

# Copy workspace package files
COPY package.json yarn.lock ./
COPY backend/package.json ./backend/

# Install production dependencies only
RUN yarn install --frozen-lockfile --production=true

# Copy built files from build stage
COPY --from=build /workspace/backend/dist ./backend/dist

# Set working directory to backend
WORKDIR /workspace/backend

# Expose backend port
EXPOSE 3000

# Set production environment
ENV NODE_ENV=production

# Start the production server
CMD ["yarn", "start:prod"]
