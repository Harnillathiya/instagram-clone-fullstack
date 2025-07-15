const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  isScreenshot: {
    type: Boolean,
    default: false
  },
  screenshotMetadata: {
    type: Object,
    default: null
  },
  imageUrl: {
    type: String,
    default: null
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'screenshot'],
    default: 'text'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  read: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('Message', MessageSchema);