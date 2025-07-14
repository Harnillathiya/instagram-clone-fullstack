const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Message = require('../models/Message');

// Middleware to protect routes
const auth = (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Authentication failed' });
  }
};

// Send a message
router.post('/', auth, async (req, res) => {
  try {
    const { recipient, content, isScreenshot, screenshotMetadata } = req.body;

    const newMessage = new Message({
      sender: req.userId,
      recipient,
      content,
      isScreenshot: isScreenshot || false,
      screenshotMetadata: screenshotMetadata || null
    });

    await newMessage.save();
    res.status(201).json(newMessage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get messages between current user and another user
router.get('/:userId', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.userId, recipient: req.params.userId },
        { sender: req.params.userId, recipient: req.userId }
      ]
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark messages as read
router.put('/read/:userId', auth, async (req, res) => {
  try {
    await Message.updateMany(
      { sender: req.params.userId, recipient: req.userId, read: false },
      { $set: { read: true } }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get messages by chat ID (for screenshot tool)
router.get('/chat/:chatId', auth, async (req, res) => {
  try {
    const [user1Id, user2Id] = req.params.chatId.split('-');
    if (req.userId !== user1Id && req.userId !== user2Id) {
      return res.status(403).json({ message: 'Not authorized to access this chat' });
    }
    const messages = await Message.find({
      $or: [
        { sender: user1Id, recipient: user2Id },
        { sender: user2Id, recipient: user1Id }
      ]
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;