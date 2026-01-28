/**
 * Support Routes
 * This file defines the API route for handling user support
 * and contact form submissions.
 * The route forwards incoming requests to the support controller,
 * which validates the input and sends the message to the system
 * support or administrator email.
 */
const express = require('express');
const {support} = require('../controllers/support.controller')
const router = express.Router();

router.post('/support',support);

module.exports = router;