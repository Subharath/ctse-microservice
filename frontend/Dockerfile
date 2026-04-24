# Frontend Docker image for production (AWS/EC2)
# Stage 1: Build static assets
FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm config set fetch-retries 5 \
	&& npm config set fetch-retry-factor 2 \
	&& npm config set fetch-retry-mintimeout 10000 \
	&& npm config set fetch-retry-maxtimeout 120000 \
	&& if [ -f package-lock.json ]; then npm ci --no-audit --no-fund --legacy-peer-deps; else npm install --no-audit --no-fund --legacy-peer-deps; fi
COPY . .
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:1.27-alpine

# SPA + API reverse proxy config
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
