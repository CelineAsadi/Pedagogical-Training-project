/**
 * User Controller
 * ----------------
 * This file contains all user-related business logic for the application.
 * It handles authentication, authorization, profile management,
 * password recovery, email verification, and lesson settings management.
 *
 * Technologies used:
 * - Node.js / Express
 * - MongoDB (Mongoose)
 * - JWT (via cookies)
 * - bcrypt for password hashing
 * - Email service for verification codes
 */
const User = require('../models/user.model');
const bcrypt = require("bcryptjs");
const generateToken = require("../lib/utlis");
const {sendEmail, generateFourDigitCode} = require('../lib/mailer');
/**
 * Registers a new user in the system.
 *
 * Validates input fields, hashes the password, saves the user in the database,
 * generates an authentication token, and sets it as a cookie.
 */
const Signup = async (req,res)=>{
    const { FName, LName, Email, password, Gender, Classlevel, TeachExp } = req.body;
  try {
    if (!FName || !LName || !Email || !password || !Gender || !Classlevel || ! TeachExp) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }
    const existingUser = await User.findOne({ Email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = new User({
      FName,
      LName,
      Email,
      password: hashedPassword,
      Gender,
      Classlevel,
      TeachExp
    });
    await newUser.save();
    generateToken(newUser._id, res);
    res.status(201).json({
      _id: newUser._id,
      FName: newUser.FName,
      LName: newUser.LName,
      Email: newUser.Email,
      Gender: newUser.Gender,
      Classlevel: newUser.Classlevel,
      TeachExp: newUser.TeachExp
    });
  } catch (err) {
    console.log("Error in signup controller", err.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * Authenticates a user using email and password.
 * If credentials are valid, generates a JWT token and stores it in a cookie.
 */
const Login = async(req,res)=>{
    const { Email, password } = req.body;
    console.log(req.body);
  try {
    const user = await User.findOne({ Email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    generateToken(user._id, res);
    res.status(200).json({
      _id: user._id,
      FName: user.FName,
      LName: user.LName,
      Email: user.Email,
      Gender: user.Gender,
      Classlevel: user.Classlevel,
      TeachExp: user.TeachExp
    });
  } catch (err) {
    console.log("Error in login controller", err.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * Logs out the currently authenticated user.
 * Clears the authentication cookie.
 */
const Logout = (req,res)=>{
    try {
        res.cookie('pedaTrain', '', { maxAge: 0 });
        res.status(200).json({ message: 'Logged out successfully' });
    } catch (err) {
        console.log("Error in logout controller", err.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

/**
 * Checks if the user is authenticated.
 * Uses user data injected by authentication middleware.
 */
const checkAuth=(req,res)=>{
    try {
    res.status(200).json({
      FName: req.user.FName,
      LName: req.user.LName,
      Email: req.user.Email,
      Gender: req.user.Gender,
      Classlevel: req.user.Classlevel,
      TeachExp: req.user.TeachExp,
    });
  } catch (err) {
    console.log("Error in checkAuth controller", err.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const verificationCodes = {};
/**
 * Handles the password reset process in two steps:
 * Step 1 ("request"):
 * - Generates a 4-digit verification code
 * - Sends the code to the user's email
 * Step 2 ("reset"):
 * - Verifies the code
 * - Hashes and updates the new password
 */
const Forgetpassword = async (req, res) => {
  try {
    const { step, Email, code, newPassword } = req.body;
    if (step === "request") {
      if (!Email) return res.status(400).json({ message: "Email is required" });
      const user = await User.findOne({ Email });
      if (!user) return res.status(404).json({ message: "User not found" });
      const verificationCode = generateFourDigitCode();
      verificationCodes[Email] = verificationCode;
      await sendEmail(
        Email,
        "Password Reset Verification Code",
        `<p>Your verification code is: <b>${verificationCode}</b></p>`
      );
      return res.status(200).json({ message: "Verification code sent to email" });
    }
    if (step === "reset") {
      if (!Email || !code || !newPassword) {
        return res.status(400).json({ message: "All fields are required" });
      }
      const savedCode = verificationCodes[Email];
      if (!savedCode) return res.status(400).json({ message: "No reset request found" });

      if (parseInt(code) !== savedCode) {
        return res.status(400).json({ message: "Invalid verification code" });
      }
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      await User.updateOne({ Email }, { password: hashedPassword });
      delete verificationCodes[Email];
      return res.status(200).json({ message: "Password reset successfully" });
    }
    res.status(400).json({ message: "Invalid step. Use 'request' or 'reset'" });
  } catch (err) {
    console.log("Error in Forgetpassword controller:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

const MainPage = (req,res)=>{};
/**
 * Updates the authenticated user's profile information.
 * Only provided fields are updated.
 * Email is validated to allow Gmail and Outlook only.
 */
const updateProfile = async (req, res) => {
  try {
    const { FName, LName, Email, Gender, Classlevel, TeachExp } = req.body;
    const userId = req.user._id;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@(gmail\.com|outlook\.com)$/;
    if (Email && !emailRegex.test(Email)) {
      return res.status(400).json({ message: "Only Gmail and Outlook emails are allowed!" });
    }
    const updateData = {};
    if (FName) updateData.FName = FName;
    if (LName) updateData.LName = LName;
    if (Email) updateData.Email = Email;
    if (Gender) updateData.Gender = Gender;
    if (Classlevel) updateData.Classlevel = Classlevel;
    if (TeachExp) updateData.TeachExp = TeachExp;
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select("-password");
    res.status(200).json(updatedUser);
  } catch (err) {
    console.log("Error in updateProfile:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

const verificationCodesForEmailUpdate = {}; 
/**
 * Verifies a new email address before updating it.
 * Step 1 ("request"):
 * - Sends a verification code to the new email
 * Step 2 ("verify"):
 * - Confirms the verification code
 */
const verifyEmailUpdate = async (req, res) => {
  try {
    const { step, Email, code } = req.body;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@(gmail\.com|outlook\.com)$/;
    if (Email && !emailRegex.test(Email)) {
      return res.status(400).json({ message: "Only Gmail and Outlook emails are allowed!" });
    }
    if (step === "request") {
      if (!Email) return res.status(400).json({ message: "Email is required" });
      const existing = await User.findOne({ Email });
      if (existing) {
        return res.status(400).json({ message: "This email is already in use" });
      }
      const verificationCode = generateFourDigitCode();
      verificationCodesForEmailUpdate[Email] = verificationCode;
      await sendEmail(
        Email,
        "Verify your new email",
        `<p>Your verification code is: <b>${verificationCode}</b></p>`
      );
      return res.status(200).json({ message: "Verification code sent" });
    }
    if (step === "verify") {
      if (!Email || !code) {
        return res.status(400).json({ message: "Email and code are required" });
      }
      const savedCode = verificationCodesForEmailUpdate[Email];
      if (!savedCode) {
        return res.status(400).json({ message: "No verification request found" });
      }
      if (parseInt(code) !== savedCode) {
        return res.status(400).json({ message: "Invalid verification code" });
      }
      delete verificationCodesForEmailUpdate[Email];
      return res.status(200).json({ message: "Email verified successfully" });
    }
    res.status(400).json({ message: "Invalid step. Use 'request' or 'verify'" });
  } catch (err) {
    console.log("Error in verifyEmailUpdate:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

const LessonSettings = require("../models/LessonSettings");
/**
 * Saves or updates lesson configuration for the authenticated user.
 * Validates that the sum of student types equals the class size.
 */
exports.saveLessonSettings = async (req, res) => {
  try {
    const userId = req.user._id; 
    const { classSize, duration, studentTypes } = req.body;
    const totalStudents = studentTypes.reduce((sum, t) => sum + t.count, 0);

    if (totalStudents !== classSize) {
      return res
        .status(400)
        .json({ message: "Total students must equal class size" });
    }
    const settings = await LessonSettings.findOneAndUpdate(
      { userId },
      { classSize, duration, studentTypes },
      { new: true, upsert: true }
    );
    res.status(200).json({
      message: "Lesson settings saved successfully",
      settings,
    });
  } catch (err) {
    console.error("Error saving lesson settings:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Retrieves lesson settings for the authenticated user.
 * If no settings exist, returns a default indicator.
 */
exports.getLessonSettings = async (req, res) => {
  try {
    const userId = req.user._id;
    const settings = await LessonSettings.findOne({ userId });
    if (!settings) {
      return res.json({ default: true });
    }
    res.json(settings);
  } catch (err) {
    console.error("Error getting lesson settings:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
    Signup,
    Login,
    Logout,
    checkAuth,
    Forgetpassword,
    MainPage,
    updateProfile,
    verifyEmailUpdate
}