const Flat = require('./../models/FlatModel');
const Message = require('./../models/MessageModel');

// Middleware to add a new message (any authenticated user can send a message to the flat owner)
exports.addMessage = async (req, res) => {
  try {
    const flatId = req.params.flatId;
    const senderId = req.currentUser._id;
    const { content } = req.body;

    const flat = await Flat.findById(flatId);
    if (!flat) {
      return res.status(404).json({ status: 'failed', message: 'Flat not found' });
    }

    // 🚫 Prevent owner from sending messages to themselves
    if (flat.owner.toString() === senderId.toString()) {
      return res.status(403).json({ status: 'failed', message: 'Owners cannot send messages to their own flats' });
    }

    const message = await Message.create({ content, flatId, senderId });

    res.status(201).json({ status: 'success', data: message });
  } catch (error) {
    console.error('Error adding message:', error);
    res.status(500).json({ status: 'failed', message: 'Server error while sending message' });
  }
};

// Middleware to get all messages for a specific flat (accessible by the flat owner)
exports.getAllMessages = async (req, res) => {
  try {
    const flatId = req.params.flatId;
    const userId = req.currentUser._id;

    const flat = await Flat.findById(flatId);
    if (!flat) {
      return res.status(404).json({ status: 'failed', message: 'Flat not found' });
    }

    const isOwner = flat.owner.toString() === userId.toString();
    const userCanMessage = true;

    let messages = [];

    if (isOwner) {
      messages = await Message.find({ flatId }).sort({ createdAt: 1 }).populate('senderId', 'firstName lastName email');
    } else {
      messages = await Message.find({ flatId, senderId: userId }).sort({ createdAt: 1 }).populate('senderId', 'firstName lastName email');
    }

    const formattedMessages = messages.map((msg) => ({
      _id: msg._id,
      flatId: msg.flatId,
      senderId: msg.senderId._id,
      content: msg.content,
      createdAt: msg.createdAt,
      senderName: `${msg.senderId.firstName} ${msg.senderId.lastName}`,
      senderEmail: msg.senderId.email,
    }));

    return res.status(200).json({
      status: 'success',
      data: formattedMessages,
      meta: {
        isOwner,
        userCanMessage,
      },
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return res.status(500).json({ status: 'failed', message: 'Error fetching messages' });
  }
};
