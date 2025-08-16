// models/UserForm.js
const mongoose = require("mongoose");

const UserFormSchema = new mongoose.Schema({
  code: { type: String, unique: true },           // Unique code assigned
  memberCount: { type: Number, required: true },  // Total members
  members: [
    {
      name: String,
      age: Number,
      aadhaar: String,        // You may want to validate length (12 digits)
      // Add more basic fields as needed
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("UserForm", UserFormSchema);
