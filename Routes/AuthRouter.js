const express = require('express');
const router = express.Router();
const { signUp,verifyEmail,Login,createEvent,forgotPassword,resetPassword,showEvents,updateEvent} = require('../Controllers/AuthController');
const isAdmin = require('../Middleware/admin');

// Get Apis
router.post('/signup/', signUp);
router.post('/login/', Login);
router.get('/verify_email',verifyEmail);
router.post('/create_event',createEvent);
router.get('/show_events',showEvents);
router.post('/update_event',updateEvent); 
router.get('/forgot_password',forgotPassword);
router.get('/reset_password',resetPassword);

module.exports = router;
