const mongoose = require("mongoose");

const userActivitySchema = new mongoose.Schema({
  username: String,
  email: String,
  loginTime: { type: Date, default: Date.now },
  ipAddress: String,
  deviceInfo: String,
});

module.exports = mongoose.model("userActivity", userActivitySchema);
