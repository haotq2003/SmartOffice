const Redis = require('ioredis');

// Lấy REDIS_URL từ .env (định dạng rediss://... cho kết nối bảo mật TLS của Upstash)
const redisUrl = process.env.REDIS_URL;

let redis = null;

if (redisUrl) {
  redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    connectTimeout: 10000,
    retryStrategy(times) {
      const delay = Math.min(times * 100, 3000);
      return delay;
    },
  });

  redis.on('connect', () => {
    console.log('🚀 [Redis] Đang kết nối tới Upstash Redis Cloud...');
  });

  redis.on('ready', () => {
    console.log('✅ [Redis] Đã kết nối thành công và sẵn sàng xử lý dữ liệu!');
  });

  redis.on('error', (err) => {
    console.error('⚠️ [Redis] Lỗi kết nối Redis:', err.message);
  });
} else {
  console.warn('⚠️ [Redis] Chưa cấu hình REDIS_URL trong file .env');
}

module.exports = redis;
