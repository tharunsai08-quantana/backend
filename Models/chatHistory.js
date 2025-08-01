const mongoose = require('mongoose');

const ChatHistorySchema = new mongoose.Schema({
  email: String,
  role: String,
  history: [
    {
      user: String,
      bot: String,
      timestamp: { type: Date, default: Date.now }
    }
  ]
});

module.exports = mongoose.model('ChatHistory', ChatHistorySchema);
