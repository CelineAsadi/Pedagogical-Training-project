const express = require("express");
const router = express.Router();

const { speakForStudent } = require("../controllers/tts.controller");

router.post("/speak", speakForStudent);

module.exports = router;
