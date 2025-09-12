const User = require('../models/user.model');
const bcrypt = require("bcryptjs");
const generateToken = require("../lib/utlis");

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
    res.status(200).json(req.user);
  } catch (err) {
    console.log("Error in checkAuth controller", err.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const Forgetpassword = (req,res)=>{

};
module.exports = {
    Signup,
    Login,
    Logout,
    checkAuth,
    Forgetpassword
}