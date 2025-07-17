const express = require('express');
const router = express.Router();
const { signUp,verifyEmail,Login } = require('../Controllers/AuthController');

// Get Apis
router.post('/signup/', signUp);
router.post('/login/', Login);
router.get('/verify_email',verifyEmail);
module.exports = router;
