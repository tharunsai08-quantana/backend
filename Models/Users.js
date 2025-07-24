const mongoose =require('mongoose');

const userSchema=new mongoose.Schema({
    name:{type:String,required:true},
    email:{type:String,required:true,unique:true},
    password:{type:String,reuired:true},
    role: {
        type: String,
        enum: ['user', 'admin', 'superuser','locked','gatekeeper'],
        default: 'user'
    },
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String, default: null },
    createdAt:{type:Date,default:Date.now},
    updatedAt:{type:Date,default:Date.now}
})

module.exports=mongoose.model("Users",userSchema);