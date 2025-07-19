const express = require('express');
const router = express.Router();
const { userEventStatus,signUp,verifyEmail,Login,createEvent,forgotPassword,resetPassword,showEvents,updateEvent,applyEvent,} = require('../Controllers/AuthController');
const isAdmin = require('../Middleware/admin');
const auth = require('../Middleware/auth');


// ✅ Auth Routes
router.post('/signup', signUp);
router.post('/login', Login);
router.get('/verify_email', verifyEmail);
router.get('/forgot_password', forgotPassword);
router.get('/reset_password', resetPassword);

// ✅ Event Management (Admin)
router.post('/create_event', isAdmin, createEvent);
router.post('/update_event', isAdmin, updateEvent);
router.get('/show_events', showEvents);


// ✅ Event Application
router.post('/apply_event',auth, applyEvent);
router.post('/event_status',userEventStatus)
module.exports = router;
