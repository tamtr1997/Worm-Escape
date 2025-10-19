FROM node:20-alpine AS builder
# Tạo thư mục làm việc
WORKDIR /app
# Cài các gói cần thiết cho build (nếu cần)
RUN apk add --no-cache libc6-compat
# Copy package.json và package-lock.json (để cache npm install)
COPY package*.json ./
# Cài dependencies
RUN npm ci
# Copy toàn bộ mã nguồn
COPY . .
# Build Next.js (tạo thư mục .next)
RUN npm run build

# =========================
# Stage 2: Runner
# =========================
FROM node:20-alpine AS runner
WORKDIR /app
# Thiết lập biến môi trường
RUN npm install sqlite sqlite3
ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001
# Copy các file cần thiết từ builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/tailwind.config.ts ./
COPY --from=builder /app/postcss.config.mjs ./
COPY --from=builder /app/tsconfig.json ./
#COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
# Cài dependencies runtime (bỏ devDependencies)
RUN npm ci --omit=dev
# Lệnh khởi động ứng dụng
CMD ["npm", "start"]