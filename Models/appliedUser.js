const mongoose = require('mongoose');

const appliedUserSchema = new mongoose.Schema({
    eventId: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    appliedAt: { type: Date},
    statusAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['applied', 'accepted', 'rejected'], default: 'applied' },
    qrCode: { type: String, required: true },
    keyId: { type: String },
    attended: { type: Boolean, default: false }
  });

  modeule.exports = mongoose.model('appliedUser', appliedUserSchema);