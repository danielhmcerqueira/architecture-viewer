# ---------- build stage ----------
FROM oven/bun:1 AS build
WORKDIR /app

# Variáveis VITE_* são resolvidas em BUILD TIME. Passe via --build-arg.
ARG VITE_API_BASE_URL=http://localhost:8000
ARG VITE_USE_MOCK=0
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_USE_MOCK=$VITE_USE_MOCK

COPY package.json bun.lock* bunfig.toml* ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

# ---------- runtime stage (somente estáticos) ----------
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
