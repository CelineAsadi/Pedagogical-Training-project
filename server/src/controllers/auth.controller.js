const User = require('../models/user.model');
const bcrypt = require("bcryptjs");
const generateToken = require("../lib/utlis");
const {sendEmail, generateFourDigitCode} = require('../lib/mailer');

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


const Logout = (req,res)=>{
    try {
        res.cookie('pedaTrain', '', { maxAge: 0 });
        res.status(200).json({ message: 'Logged out successfully' });
    } catch (err) {
        console.log("Error in logout controller", err.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

const checkAuth=(req,res)=>{
    try {
    //res.status(200).json(req.user);
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

// ================= Forget Password ====================
const Forgetpassword = async (req, res) => {
  try {
    const { step, Email, code, newPassword } = req.body;

    // STEP 1: Request reset code
    if (step === "request") {
      if (!Email) return res.status(400).json({ message: "Email is required" });

      const user = await User.findOne({ Email });
      if (!user) return res.status(404).json({ message: "User not found" });

      // Generate 4-digit code
      const verificationCode = generateFourDigitCode();
      verificationCodes[Email] = verificationCode;

      // Send email
      await sendEmail(
        Email,
        "Password Reset Verification Code",
        `<p>Your verification code is: <b>${verificationCode}</b></p>`
      );

      return res.status(200).json({ message: "Verification code sent to email" });
    }

    // STEP 2: Verify code & reset password
    if (step === "reset") {
      if (!Email || !code || !newPassword) {
        return res.status(400).json({ message: "All fields are required" });
      }

      const savedCode = verificationCodes[Email];
      if (!savedCode) return res.status(400).json({ message: "No reset request found" });

      if (parseInt(code) !== savedCode) {
        return res.status(400).json({ message: "Invalid verification code" });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      await User.updateOne({ Email }, { password: hashedPassword });

      // Clear the used code
      delete verificationCodes[Email];

      return res.status(200).json({ message: "Password reset successfully" });
    }

    res.status(400).json({ message: "Invalid step. Use 'request' or 'reset'" });
  } catch (err) {
    console.log("Error in Forgetpassword controller:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};


const MainPage = (req,res)=>{

};
// ======= Update Profile =========
const updateProfile = async (req, res) => {
  try {
    const { FName, LName, Email, Gender, Classlevel, TeachExp } = req.body;
    const userId = req.user._id;

    // אימות אימייל
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

module.exports = {
    Signup,
    Login,
    Logout,
    checkAuth,
    Forgetpassword,
    MainPage,
    updateProfile
}