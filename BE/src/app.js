require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');

const swaggerSpec = require('./config/swagger');
const authRoutes = require('./routes/authRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const tenantRoutes = require('./routes/tenantRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const accessControlRoutes = require('./routes/accessControlRoutes');
const planRoutes = require('./routes/planRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const redis = require('./config/redis');
const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// Routes
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/auth', authRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/access-control', accessControlRoutes);
app.use('/api', bookingRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/payment', paymentRoutes);

// Redis Healthcheck & Demo route
app.get('/api/redis-health', async (req, res) => {
  try {
    const startTime = Date.now();
    if (!redis) {
      return res.status(500).json({ success: false, message: 'Redis chưa được khởi tạo' });
    }
    // Tăng số đếm trên RAM
    const visits = await redis.incr('demo:visit_count');
    // Lưu thời gian truy cập gần nhất, tự hủy sau 300s (5 phút)
    await redis.set('demo:last_visit', new Date().toLocaleString('vi-VN'), 'EX', 300);
    const lastVisit = await redis.get('demo:last_visit');
    const remainingTTL = await redis.ttl('demo:last_visit');
    const latency = Date.now() - startTime;

    res.json({
      success: true,
      message: 'Kết nối Upstash Redis Cloud hoạt động hoàn hảo!',
      data: {
        engine: 'Upstash Serverless Redis (In-Memory)',
        totalVisitsCountedOnRAM: visits,
        lastVisitTime: lastVisit,
        autoExpireInSeconds: `${remainingTTL}s`,
        responseLatency: `${latency}ms (Phản hồi siêu tốc)`
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Basic route
app.get('/', (req, res) => {
  res.send('API is running...');
});

module.exports = app;
