const express = require('express');

const {Signup, Login, Logout, checkAuth,Forgetpassword,MainPage,updateProfile} = require("../controllers/auth.controller");
const protectRoute = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/Signup',Signup);
router.post('/Login',Login);
router.post('/Logout',Logout);
router.post('/Forgetpassword',Forgetpassword);
router.get('/check',protectRoute,checkAuth)
router.post('/MainPage',MainPage);
router.put('/Profile',protectRoute,updateProfile);


module.exports = router;