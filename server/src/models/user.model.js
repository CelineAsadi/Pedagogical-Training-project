/**
 * User Model
 * This file defines the schema for system users (teachers).
 * A user represents a teacher participating in the pedagogical
 * training platform and serves as the owner of lessons,
 * sessions, and classroom simulations.
 */
const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
  FName: { type: String, required: true },
  LName: { type: String, required: true },
  Email: { type: String, required: true, unique: true },
  password: { type: String, required: true, unique: true, minlength:6 },
  Gender: { type: String, enum: ["Female", "Male"], required: true },
  Classlevel: { type: Number, min: 3, max: 6, required: true },
  TeachExp: { type: String, enum: ["0-1", "2-5","5+"], required: true},//Years of teaching experience
});

const User = mongoose.model("User",userSchema);

module.exports = User;