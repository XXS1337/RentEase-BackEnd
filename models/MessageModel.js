const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
      minlength: [1, 'Message cannot be empty'],
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
    },
    flatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Flat',
      required: [true, 'Flat ID is required'],
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender ID is required'],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Message', messageSchema);
