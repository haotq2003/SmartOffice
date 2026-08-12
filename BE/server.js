const app = require('./src/app');
const connectDB = require('./src/config/db');
const http = require('http');
const { initSocket } = require('./src/config/socket');

// Connect to database
connectDB();

const server = http.createServer(app);

// Initialize Socket.io server
initSocket(server);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
