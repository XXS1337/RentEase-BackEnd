const User = require('./../models/UserModel');
const Flat = require('./../models/FlatModel');
const Message = require('./../models/MessageModel');
const { v2: cloudinary } = require('cloudinary');
const logger = require('../utils/logger');

// * Admin only middleware
// Middleware to get all users from the database (admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 100000, sort, ...filters } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const matchStage = {};

    // Filter: role
    if (filters.role) {
      matchStage.role = filters.role;
    }

    // Filter: age range (calculated from birthDate)
    if (filters.age) {
      const [min, max] = filters.age.split('-').map(Number);
      const now = new Date();
      const minDate = new Date(now.getFullYear() - max, now.getMonth(), now.getDate());
      const maxDate = new Date(now.getFullYear() - min, now.getMonth(), now.getDate());
      matchStage.birthDate = { $gte: minDate, $lte: maxDate };
    }

    // Pipeline
    const pipeline = [
      { $match: matchStage },

      // Add flats count & age
      {
        $addFields: {
          publishedFlatsCount: { $size: { $ifNull: ['$addedFlats', []] } },
          age: {
            $dateDiff: {
              startDate: '$birthDate',
              endDate: '$$NOW',
              unit: 'year',
            },
          },
        },
      },

      // Filter: publishedFlatsCount
      ...(filters.flatsCount
        ? (() => {
            const [min, max] = filters.flatsCount.split('-').map(Number);
            return [
              {
                $match: {
                  publishedFlatsCount: { $gte: min, $lte: max },
                },
              },
            ];
          })()
        : []),

      // Sort
      (() => {
        if (!sort) return { $sort: { createdAt: -1 } };
        const sortObj = {};
        const fields = sort.split(',');
        for (const field of fields) {
          const dir = field.startsWith('-') ? -1 : 1;
          const name = field.replace('-', '');
          sortObj[name] = dir;
        }
        return { $sort: sortObj };
      })(),

      { $skip: skip },
      { $limit: Number(limit) },

      // Project only needed fields
      {
        $project: {
          _id: 0,
          id: '$_id',
          firstName: 1,
          lastName: 1,
          email: 1,
          birthDate: 1,
          age: 1,
          role: 1,
          publishedFlatsCount: 1,
          createdAt: 1,
        },
      },
    ];

    const users = await User.aggregate(pipeline);
    const totalCount = await User.countDocuments(matchStage);

    return res.status(200).json({
      status: 'success',
      message: 'Users retrieved successfully',
      page: Number(page),
      limit: Number(limit),
      totalCount,
      count: users.length,
      data: users,
    });
  } catch (error) {
    logger.error(`Error retrieving users: ${error.message}`);
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
    Object.assign(user, req.body);
    await user.save();

    // 4) Return success response with the updated user data
    return res.status(200).json({ status: 'success', message: 'User updated successfully!', updatedUser: user });
  } catch (error) {
    // Handle any server errors
    logger.error(`Error updating user: ${error.message}`);
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
    logger.error(`Error updating user role: ${error.message}`);
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
    logger.error(`Error deleting user: ${error.message}`);
    return res.status(500).json({ status: 'failed', message: 'Error deleting user', error: error.message });
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
    logger.error(`Error retrieving user by ID: ${error.message}`);
    res.status(500).json({ status: 'failed', message: 'Error retrieving user', error: error.message });
  }
};
