const Flat = require('./../models/FlatModel');
const Message = require('./../models/MessageModel');

// Middleware to add a new message (any authenticated user can send a message to the flat owner)
exports.addMessage = async (req, res) => {
  try {
    const flatId = req.params.flatId;
    const senderId = req.currentUser._id;
    const { content } = req.body;

    // 1. Check if flat exists
    const flat = await Flat.findById(flatId);
    if (!flat) {
      return res.status(404).json({ status: 'failed', message: 'Flat not found' });
    }

    // 2. Create the message document
    const message = await Message.create({
      content,
      flatId,
      senderId,
    });

    // 3. Push message ID to flat's messages array
    flat.messages.push(message._id);
    await flat.save();

    return res.status(201).json({ status: 'success', message: 'Message sent successfully', data: message });
  } catch (error) {
    //  Handle any server errors
    res.status(500).json({ status: 'failed', message: 'Error sending message' });
  }
};

// Middleware to get messages between a specific flat owner and a specific sender (flat owner can filter by sender)
exports.getUserMessages = async (req, res) => {
  try {
    const flatId = req.params.flatId;
    const senderId = req.params.senderId;
    const userId = req.currentUser._id;

    // 1. Check if flat exists
    const flat = await Flat.findById(flatId);

    if (!flat) {
      return res.status(404).json({ status: 'failed', message: 'Flat not found' });
    }

    // 2. Check if the current user is the owner of the flat
    if (flat.owner.toString() !== userId.toString()) {
      return res.status(403).json({ status: 'failed', message: 'You can only view messages for your own flats' });
    }

    // 3. Populate the 'messages' field with message data, filtered by the senderId
    const populatedFlat = await Flat.findById(flatId).populate({
      path: 'messages',
      match: { senderId: senderId }, // Filter messages by senderId
      select: 'content senderId createdAt', // Only select relevant fields
    });

    // 4. If no messages are found from the specified sender, return an empty array
    if (!populatedFlat.messages) {
      return res.status(200).json({ status: 'success', data: [] });
    }

    // 5. Return the filtered messages from the specified sender
    return res.status(200).json({ status: 'success', data: populatedFlat.messages });
  } catch (error) {
    //  Handle any server errors
    return res.status(500).json({ status: 'failed', message: 'Error fetching user messages' });
  }
};

// Middleware to get all messages for a specific flat (accessible by the flat owner)
exports.getAllMessages = async (req, res) => {
  try {
    const flatId = req.params.flatId;
    const userId = req.currentUser._id;

    // 1. Find the flat to check if the user is the owner of the flat
    const flat = await Flat.findById(flatId);
    if (!flat) {
      return res.status(404).json({ status: 'failed', message: 'Flat not found' });
    }

    // 2  Check if the current user is the owner of the flat
    if (flat.owner.toString() !== userId.toString()) {
      return res.status(403).json({ status: 'failed', message: 'You can only view messages for your own flats' });
    }

    // 3. Populate the 'messages' field with the full details of each message (e.g., content, senderId, createdAt)
    const populatedFlat = await Flat.findById(flatId).populate({
      path: 'messages',
      select: 'content senderId createdAt',
    });

    // 4. Return the populated messages for the flat
    return res.status(200).json({ status: 'success', data: populatedFlat.messages });
  } catch (error) {
    //  Handle any server errors
    return res.status(500).json({ status: 'failed', message: 'Error fetching messages' });
  }
};
