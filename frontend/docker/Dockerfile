# =====================
# Stage 1: Development
# =====================
FROM node:22-alpine AS dev
WORKDIR /workspace

# Copy workspace package files
COPY package.json yarn.lock ./
COPY frontend/package.json ./frontend/

# Install all workspace dependencies
RUN yarn install --frozen-lockfile

# Set working directory to frontend
WORKDIR /workspace/frontend

# Dev port Vite
EXPOSE 5173

# Start the development server
CMD ["yarn", "dev"]

# =====================
# Stage 2: Production build
# =====================
FROM node:22-alpine AS build
WORKDIR /workspace

# Copy workspace package files
COPY package.json yarn.lock ./
COPY frontend ./frontend

# Install all workspace dependencies
RUN yarn install --frozen-lockfile

# Build frontend
WORKDIR /workspace/frontend
RUN yarn build:prod

# =====================
# Stage 3: Nginx serve
# =====================
FROM nginx:alpine AS prod

COPY --from=build /workspace/frontend/dist /usr/share/nginx/html

# Rewrites to handle SPA routing
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
EXPOSE 443

CMD ["nginx", "-g", "daemon off;"]
