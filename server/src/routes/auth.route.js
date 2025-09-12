const express = require('express');

const {Signup, Login, Logout, checkAuth,Forgetpassword} = require("../controllers/auth.controller");
const protectRoute = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/Signup',Signup);
router.post('/Login',Login);
router.post('/Logout',Logout);
router.post('/Forgetpassword',Forgetpassword);
router.get('/check',protectRoute,checkAuth)


module.exports = router;