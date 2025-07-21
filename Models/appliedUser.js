const mongoose = require('mongoose');

const appliedUserSchema = new mongoose.Schema({
    eventId: { type: String, required: true },
    title: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    appliedAt: { type: Date},
    eventDate: { type: Date, required: true },
    statusAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['Applied', 'Approved', 'Rejected'], default: 'Applied' },
    qrCode: { type: String },
    keyId: { type: String },
    attended: { type: Boolean, default: false }
  });

  module.exports=mongoose.model("appliedUser",appliedUserSchema);
