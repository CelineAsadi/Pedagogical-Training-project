const express = require('express');
const {support} = require('../controllers/support.controller')

const router = express.Router();

router.post('/support',support);

module.exports = router;