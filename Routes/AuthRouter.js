const express = require('express');
const router = express.Router();
const {signUp,verifyEmail,Login,createEvent,forgotPassword,resetPassword,showEvents,updateEvent,applyEvent,appliedEvent,idVerification,userEventStatus} = require('../Controllers/AuthController');
const isAdmin = require('../Middleware/admin');
const auth = require('../Middleware/auth');


router.post('/signup', signUp);
router.post('/login', Login);
router.get('/verify_email', verifyEmail);
router.get('/forgot_password', forgotPassword);
router.get('/reset_password', resetPassword);

router.post('/create_event', createEvent);
router.post('/update_event', updateEvent);
router.post('/show_events', showEvents);
router.post('/event_verification',idVerification)

router.post('/apply_event', applyEvent);
router.post('/applied_event', appliedEvent);
router.post('/approve_status',userEventStatus)
module.exports = router;
