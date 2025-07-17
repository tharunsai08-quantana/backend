const mongoose =reuire('mongoose');

const userSchema=new mongoose.schema({
    name:{type:String,required:true},
    email:{type:String,required:true,unique:true},
    password:{type:String,reuired:true},
    role: {
        type: String,
        enum: ['user', 'admin', 'superuser'],
        default: 'user'
    },
    createdAt:{type:Date,default:Date.now},
    updatedAt:{type:Date,default:Date.now}
})

module.exports=mongoose.model("User",userSchema);