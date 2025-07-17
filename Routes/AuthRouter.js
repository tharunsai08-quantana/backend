const express = require('express');
const router = express.Router();
const { dummy,usersData } = require('../Controllers/AuthController');

// Get Apis
router.get('/users', usersData);
router.get('/dummy', dummy);
module.exports = router;
