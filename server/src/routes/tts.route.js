/**
 * Text-to-Speech Routes
 * This file defines API routes for text-to-speech (TTS) functionality.
 * The route allows the system to generate synthesized speech
 * for student avatars during classroom simulations.
 * It forwards incoming requests to the TTS controller, which
 * handles voice parameter validation and audio generation.
 */
const express = require("express");
const router = express.Router();
const { speakForStudent } = require("../controllers/tts.controller");

router.post("/speak", speakForStudent);

module.exports = router;