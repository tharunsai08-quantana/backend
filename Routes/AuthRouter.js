const express = require('express');
const router = express.Router();
const {signUp,verifyEmail,askLlm,Login,attendedUsers,movingCount,eventDetailsforGatekeeper,createEvent,deleteEvent,forgotPassword,resetPassword,showEvents,updateEvent,applyEvent,appliedEvent,idVerification,showApprovedEvents,userEventStatus} = require('../Controllers/AuthController');
const isAdmin = require('../Middleware/admin');
const auth = require('../Middleware/auth');
const attendedUser = require('../Models/attendedUser');


router.post('/signup', signUp);
router.post('/login', Login);
router.get('/verify_email', verifyEmail);
router.get('/forgot_password', forgotPassword);
router.get('/reset_password', resetPassword);
router.get('/count', movingCount);
router.get('/ask_llm', askLlm);

router.post('/create_event', createEvent);
router.post('/update_event', updateEvent);
router.post('/show_events', showEvents);
router.post('/event_verification',idVerification)
router.get('/attended_user',attendedUsers)
router.get('/approved_events', showApprovedEvents);
router.post('/apply_event', applyEvent);
router.post('/applied_event', appliedEvent);
router.post('/approve_status',userEventStatus)
router.post('/delete_event', deleteEvent);
router.get('/event_data', eventDetailsforGatekeeper);

module.exports = router;
