/**
 * Database Connection Utility
 * ---------------------------
 * This file is responsible for establishing a connection to MongoDB
 * using Mongoose.
 *
 * It loads environment variables and initializes a single database
 * connection for the application.
 *
 * This utility is typically called once during server startup.
 */
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config;
/**
 * Establishes a connection to the MongoDB database.
 * Uses the connection string provided via environment variables
 * and logs the connected host on success.
 */
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