/**
 * Authentication Routes
 * This file defines all HTTP routes related to user authentication,
 * authorization, and profile management.
 * It connects incoming API requests to the appropriate controller
 * functions and applies authentication middleware where required.
 */
const express = require('express');
const {Signup, Login, Logout, checkAuth,Forgetpassword,MainPage,updateProfile,verifyEmailUpdate} = require("../controllers/auth.controller");
const protectRoute = require('../middleware/auth.middleware');
const router = express.Router();

router.post('/Signup',Signup);
router.post('/Login',Login);
router.post('/Logout',Logout);
router.post('/Forgetpassword',Forgetpassword);
router.get('/check',protectRoute,checkAuth)
router.post('/MainPage',MainPage);
router.put('/Profile',protectRoute,updateProfile);
router.post('/verify-email-update', verifyEmailUpdate);

module.exports = router;