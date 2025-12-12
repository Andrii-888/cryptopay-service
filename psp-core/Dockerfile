# Stage 1: build NestJS app
FROM node:20-alpine AS builder

WORKDIR /app

# Копируем package*.json из подпапки psp-core (контекст = корень репо)
COPY psp-core/package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем весь исходный код из psp-core
COPY psp-core/. .

# Собираем NestJS в dist/
RUN npm run build

# Stage 2: минимальный runtime-образ
FROM node:20-alpine AS runner

WORKDIR /app

# Копируем package*.json и ставим только прод-зависимости
COPY --from=builder /app/package*.json ./
RUN npm install --omit=dev

# Копируем собранный dist из builder-стадии
COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "dist/main.js"]
