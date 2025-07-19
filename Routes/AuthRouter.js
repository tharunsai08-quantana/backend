const express = require('express');
const router = express.Router();
const { signUp,verifyEmail,Login,eventDetails,forgotPassword,resetPassword} = require('../Controllers/AuthController');

// Get Apis
router.post('/signup/', signUp);
router.post('/login/', Login);
router.get('/verify_email',verifyEmail);
router.post('/create_event',eventDetails);
router.get('/forgot_password',forgotPassword);
router.get('/reset_password',resetPassword);

module.exports = router;
