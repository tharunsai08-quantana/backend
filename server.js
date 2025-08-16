const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const AuthRouter = require('./Routes/AuthRouter');
const advRouter = require('./Routes/advRouter');
const connectDB = require('./Config/db');
const { redisClient, connectRedis } = require('./redisClient'); 

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

connectDB();

const server = http.createServer(app);         
const io = new Server(server, {                
  cors: {
    origin: '*', 
    methods: ['GET', 'POST']
  }
});

app.set('socketio', io); 

connectRedis()
  .then(() => {
    
    app.use('/auth', AuthRouter);
    app.use('/adv', advRouter);

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
      console.log('✅ Redis connected');
    });
  })
  .catch((err) => console.error('Redis connection failed', err));

module.exports = app;
