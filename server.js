import 'dotenv/config';
import http from 'http';
import app from './src/app.js';
import connectDB from './src/config/db.js';
import socketService from './src/socket/socket.js';

const PORT = process.env.PORT || 5000;


connectDB();


const server = http.createServer(app);


socketService.init(server);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});