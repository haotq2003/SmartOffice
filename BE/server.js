const app = require('./src/app');
const connectDB = require('./src/config/db');
const http = require('http');
const { initSocket } = require('./src/config/socket');
const { startOverdueChecker } = require('./src/services/cronService');

// Connect to database
connectDB();

const server = http.createServer(app);

// Initialize Socket.io server
initSocket(server);

// Start background cron service for overdue equipment tracking
startOverdueChecker();

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
