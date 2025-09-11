const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config;

const ConnectDB = async()=>{
    try {
        console.log(process.env.MONGOBD_URI)
    const con = await mongoose.connect(process.env.MONGOBD_URI);
    console.log(`MongoDB connection: ${con.connection.host}`);
  } catch (err) {
    console.log('MongoDB connection error:', err);
  }
}


module.exports = ConnectDB;