const express = require("express");
const router = express.Router();
const advController = require("../Controllers/advController");

// Make sure all below are functions!
router.post("/enter-form", advController.enterForm);
router.post("/submit-form", advController.submitForm);
router.post("/leave-form", advController.leaveForm);

module.exports = router;
