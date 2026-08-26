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
// Basic route
app.get('/', (req, res) => {
  res.send('API is running...');
});

module.exports = app;
