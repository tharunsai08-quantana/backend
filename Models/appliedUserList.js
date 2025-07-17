const mongoose = require('mongoose');
const appliedUserListSchema = new mongoose.Schema({
    eventId: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    appliedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['applied', 'accepted', 'rejected'], default: 'applied' },
    attened: { type: Boolean, default: false }
});