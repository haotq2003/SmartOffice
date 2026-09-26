FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Cài dependencies
RUN npm install

# Copy toàn bộ source code
COPY . .

EXPOSE 3000

# Chạy Next.js dev server
CMD ["npm", "run", "dev"]
