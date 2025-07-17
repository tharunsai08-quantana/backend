const express = require('express');
const router = express.Router();
const { signUp,verifyEmail } = require('../Controllers/AuthController');

// Get Apis
router.post('/signup/', signUp);
router.get('/verify_email',verifyEmail);
module.exports = router;
