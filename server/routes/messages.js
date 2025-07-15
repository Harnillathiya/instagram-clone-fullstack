const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Message = require('../models/Message');
const User = require('../models/User');
const { GridFsStorage } = require('multer-gridfs-storage');
const crypto = require('crypto');
const { getGFS } = require('../gridfs');
const mongoose = require('mongoose');

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

// GridFS storage engine
const storage = new GridFsStorage({
  url: process.env.MONGO_URI || 'mongodb://localhost:27017/instagram-chat',
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) return reject(err);
        const filename = buf.toString('hex') + path.extname(file.originalname);
        resolve({
          filename: filename,
          bucketName: 'uploads'
        });
      });
    });
  }
});
const upload = multer({ storage });

// Upload image to GridFS
router.post('/upload-image', auth, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No image file provided' });
  }
  // Return the file id and filename
  res.json({ fileId: req.file.id, filename: req.file.filename });
});

// Serve image from GridFS
router.get('/image/:id', async (req, res) => {
  try {
    const gfs = getGFS();
    if (!gfs) return res.status(500).json({ message: 'GFS not initialized' });

    const file = await gfs.files.findOne({ _id: mongoose.Types.ObjectId(req.params.id) });
    if (!file) return res.status(404).json({ message: 'File not found' });

    const readstream = gfs.createReadStream({ _id: file._id });
    res.set('Content-Type', file.contentType);
    readstream.pipe(res);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving image' });
  }
});

// Send a message
router.post('/', auth, async (req, res) => {
  try {
    const { recipient, content, isScreenshot, screenshotMetadata, imageFileId, messageType } = req.body;

    const newMessage = new Message({
      sender: req.userId,
      recipient,
      content,
      isScreenshot: isScreenshot || false,
      screenshotMetadata: screenshotMetadata || null,
      imageFileId: imageFileId || null,
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