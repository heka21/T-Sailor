# ---- build ----
FROM node:22-alpine AS build
WORKDIR /app
RUN npm install -g pnpm@12.4.1
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# ---- api: accounts & progress (no dependencies) ----
FROM node:22-alpine AS api
WORKDIR /app
COPY server/ ./
RUN mkdir /data && chown node:node /data
USER node
ENV DATA_DIR=/data PORT=8091
VOLUME /data
EXPOSE 8091
CMD ["node", "server.mjs"]

# ---- serve ----
FROM nginx:alpine AS web
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
