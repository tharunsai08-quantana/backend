const mongoose=require('mongoose');

const eventSchema=new mongoose.Schema({
    eventId: { type: String, required: true, unique: true },
    organizer: { type: String, ref: 'User', required: true },
    title: { type: String, required: true },
    speaker: { type: String, required: true },
    image: { type: String, required: true },
    hostedBy: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },
    location: { type: String, required: true },
    createdBy: {type:String, required: true },
    updatedAt: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now }
});

module.exports=mongoose.model("Event",eventSchema);