# 1. Dùng image Node.js bản nhẹ (alpine)
FROM node:20-alpine

# 2. Cài pnpm (vì BE bạn dùng pnpm)
RUN corepack enable && corepack prepare pnpm@latest --activate

# 3. Tạo thư mục làm việc trong container
WORKDIR /app

# 4. Copy file khai báo thư viện trước để cache build
COPY package.json pnpm-lock.yaml ./

# 5. Cài đặt dependencies
RUN pnpm install

# 6. Copy toàn bộ code vào
COPY . .

# 7. Mở port 5000
EXPOSE 5000

# 8. Lệnh chạy backend ở chế độ dev (nodemon tự reload khi đổi code)
CMD ["pnpm", "dev"]
