const express = require('express');
const router = express.Router();
const { signUp,verifyEmail,Login,eventDetails} = require('../Controllers/AuthController');

// Get Apis
router.post('/signup/', signUp);
router.post('/login/', Login);
router.get('/verify_email',verifyEmail);
router.post('/event_details',eventDetails);
module.exports = router;
