const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Message = require('../models/Message');
const User = require('../models/User');

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

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/images';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Upload image
router.post('/upload-image', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const imageUrl = `/uploads/images/${req.file.filename}`;
    res.json({ 
      imageUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size
    });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ message: 'Image upload failed' });
  }
});

// Send a message
router.post('/', auth, async (req, res) => {
  try {
    const { recipient, content, isScreenshot, screenshotMetadata, imageUrl, messageType } = req.body;

    const newMessage = new Message({
      sender: req.userId,
      recipient,
      content,
      isScreenshot: isScreenshot || false,
      screenshotMetadata: screenshotMetadata || null,
      imageUrl: imageUrl || null,
      messageType: messageType || 'text' // 'text', 'image', 'screenshot'
    });

    await newMessage.save();

    // Increment unread count for recipient
    const recipientUser = await User.findById(recipient);
    if (recipientUser) {
      const currentCount = recipientUser.unreadCount.get(req.userId.toString()) || 0;
      recipientUser.unreadCount.set(req.userId.toString(), currentCount + 1);
      await recipientUser.save();
    }

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

    // Mark messages from the other user as read
    await Message.updateMany(
      { sender: req.params.userId, recipient: req.userId, read: false },
      { $set: { read: true } }
    );

    // Reset unread count for this user from the other user
    const currentUser = await User.findById(req.userId);
    if (currentUser) {
      currentUser.unreadCount.set(req.params.userId, 0);
      await currentUser.save();
    }

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

    // Reset unread count for this user from the other user
    const currentUser = await User.findById(req.userId);
    if (currentUser) {
      currentUser.unreadCount.set(req.params.userId, 0);
      await currentUser.save();
    }

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