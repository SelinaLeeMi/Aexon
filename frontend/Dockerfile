# Frontend multi-stage Dockerfile (expects frontend/nginx.conf present)
FROM node:18 AS build
WORKDIR /app

# Install deps
COPY package*.json ./

# Stable npm install setup for Docker
RUN npm config set fetch-retries 5 \
    && npm config set fetch-retry-factor 2 \
    && npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 120000 \
    && npm config set registry https://registry.npmjs.org/ \
    && npm config set prefer-online true \
    && npm config set progress=false \
    && npm config set fetch-timeout 120000 \
    && npm config set strict-ssl false \
    && npm install --production=false


# Copy source and build
COPY . .
ARG REACT_APP_API_BASE
ARG REACT_APP_WS_URL
ENV REACT_APP_API_BASE $REACT_APP_API_BASE
ENV REACT_APP_WS_URL $REACT_APP_WS_URL
RUN npm run build -- --no-eslint


# Production image
FROM nginx:1.23-alpine
# Copy built app
COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx config (expects frontend/nginx.conf present in build context)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]