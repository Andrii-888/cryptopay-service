# ---------- builder ----------
FROM node:20-alpine AS builder
WORKDIR /app

# иногда нужно для нативных модулей
RUN apk add --no-cache libc6-compat

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build


# ---------- runner ----------
FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache libc6-compat
ENV NODE_ENV=production

# важно: папка для SQLite должна существовать
RUN mkdir -p /app/data

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/main.js"]
