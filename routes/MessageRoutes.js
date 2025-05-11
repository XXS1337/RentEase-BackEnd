const express = require('express');
const router = express.Router();
const authController = require('./../controllers/AuthController');
const messageController = require('./../controllers/MessageController');

// Route to send a new message (any authenticated user can send a message to the flat owner)
router.post('/:flatId/messages', authController.protect, messageController.addMessage);

// Route to get all messages for a specific flat (accessible by the flat owner)
router.get('/:flatId/messages', authController.protect, messageController.getAllMessages);

module.exports = router;
