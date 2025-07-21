const mongoose =require('mongoose');

const attendedUserSchema = new mongoose.Schema({
    eventId: { type: String, required: true },
    title: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    attened: { type: Boolean, default: true },
    verificationTime: { type: Date, default: Date.now }
});

module.exports = mongoose.model("attendedUser", attendedUserSchema);