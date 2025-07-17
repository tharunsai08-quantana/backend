const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const AuthRouter = require('./Routes/AuthRouter');
const connectDB = require('./config/db');
dotenv.config();


const app = express();
app.use(cors());
app.use(express.json());

connectDB();

app.use('/auth', AuthRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app;
