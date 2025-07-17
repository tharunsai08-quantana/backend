const express = require('express');
const cors = require('cors');
const router = express.Router();

console.log("I am in authController.js");

const dummy = async (req, res) => {
  res.send('Hello from Auth Router!');
};



const usersData=async (Request,res)=>{
  console.log("Entering usersData function");
  db.collection_1.findOne({name: "David Sullivan"}).toArray((err,result)=>{
    if(err) {
      res.status(500).send("Error fetching data");
    } else {
      res.status(200).json(result);
    }
  });
}

module.exports={usersData, dummy};