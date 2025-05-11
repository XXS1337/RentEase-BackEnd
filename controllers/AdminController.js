const User = require('./../models/UserModel');
const Flat = require('./../models/FlatModel');
const Message = require('./../models/MessageModel');
const { v2: cloudinary } = require('cloudinary');

// * Admin only middleware
// Middleware to get all users from the database (admin only)
exports.getAllUsers = async (req, res) => {
  try {
    // 1) Find all users in the database
    const users = await User.find({}).select('-password -activeToken -createdAt -updatedAt -__v');

    // 2) Send a success response with the list of users
    return res.status(200).json({ status: 'success', message: 'Users retrieved successfully', data: users });
  } catch (error) {
    // Handle any server errors
    return res.status(500).json({ status: 'failed', message: 'Error retrieving users', error: error.message });
  }
};

// Middleware to update user by ID
exports.editUserById = async (req, res) => {
  try {
    // 1) Get user ID from the parameters
    const userId = req.params.id;

    // 2) Check if the user exists
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ status: 'failed', message: 'User not found!' });
    }

    // 3) Update the user with the data provided in the request body
    const updatedUser = await User.findByIdAndUpdate(userId, req.body, { new: true, runValidators: true });

    // 4) Return success response with the updated user data
    return res.status(200).json({ status: 'success', message: 'User updated successfully!', updatedUser });
  } catch (error) {
    // Handle any server errors
    return res.status(500).json({ status: 'failed', message: 'Error updating user', error: error.message });
  }
};

// Middleware to update the role of a user by admin
exports.updateRole = async (req, res) => {
  try {
    const userId = req.params.id;
    const newRole = req.body.role;

    // 1) Validate the new role
    const validRoles = ['admin', 'user'];
    if (!validRoles.includes(newRole)) {
      return res.status(400).json({ status: 'failed', message: 'Invalid role specified!' });
    }

    // 2) Check if the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ status: 'failed', message: 'User not found!' });
    }

    // 3) Update the user's role
    user.role = newRole;
    await user.save();

    // 4) Return a success response
    return res.status(200).json({ status: 'success', message: 'User role updated successfully!', user });
  } catch (error) {
    // 5) Handle any server errors
    return res.status(500).json({ status: 'failed', message: 'Error updating user role', error: error.message });
  }
};

// Middleware to delete a user by ID
exports.deleteUserById = async (req, res) => {
  try {
    const userId = req.params.id;

    // 1. Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ status: 'failed', message: 'User not found!' });
    }

    // 2. Delete all messages sent by this user
    await Message.deleteMany({ senderId: userId });

    // 3. Find all flats owned by this user
    const flats = await Flat.find({ owner: userId });

    for (const flat of flats) {
      // 4. Delete Cloudinary image if exists
      if (flat.image && flat.image.public_id) {
        await cloudinary.uploader.destroy(flat.image.public_id);
      }

      // 5. Delete all messages related to this flat
      await Message.deleteMany({ flatId: flat._id });

      // 6. Remove this flat from favoriteFlats of all users
      await User.updateMany({ favoriteFlats: flat._id }, { $pull: { favoriteFlats: flat._id } });
    }

    // 7. Delete all flats owned by this user
    await Flat.deleteMany({ owner: userId });

    // 8. Delete the user from the database
    await User.findByIdAndDelete(userId);

    // 9. Return success message
    return res.status(200).json({ status: 'success', message: 'User and all associated data deleted successfully!' });
  } catch (error) {
    return res.status(500).json({ status: 'failed', message: 'Error deleting user', error: error.message });
  }
};

// Middleware to get how many flats has each user
exports.getUsersFlatCount = async (req, res) => {
  try {
    // 1. Retrieve all users with basic fields
    const users = await User.find({}, 'firstName lastName email role').lean();

    // 2. For each user, count the number of flats they own
    const result = await Promise.all(
      users.map(async (user) => {
        const flatCount = await Flat.countDocuments({ owner: user._id });
        return {
          ...user,
          flatCount,
        };
      })
    );

    // 3. Return the list of users with flat count
    res.status(200).json({
      status: 'success',
      count: result.length,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching users with flat count:', error);
    res.status(500).json({
      status: 'failed',
      message: 'Error fetching users with flat count',
      error: error.message,
    });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ status: 'failed', message: 'User not found' });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ status: 'failed', message: 'Error retrieving user', error: error.message });
  }
};
