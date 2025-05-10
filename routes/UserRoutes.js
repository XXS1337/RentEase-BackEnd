const express = require('express');
const router = express.Router();
const authController = require('./../controllers/AuthController');
const adminController = require('./../controllers/AdminController');

// Regular user routes (authController)
router.post('/register', authController.register);
router.post('/checkEmail', authController.checkEmail);
router.post('/login', authController.login);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);
router.get('/me', authController.protect, authController.getMe);
router.patch('/updateMyProfile', authController.protect, authController.updateProfile);
router.delete('/deleteMyProfile', authController.protect, authController.deleteProfile);

// Admin routes (adminController)
router.get('/allUsers', authController.protect, authController.restrictIfNotAdmin, adminController.getAllUsers);
router.patch('/editProfile/:id', authController.protect, authController.restrictIfNotAdmin, adminController.editUserById);
router.patch('/updateRole/:id', authController.protect, authController.restrictIfNotAdmin, adminController.updateRole);
router.delete('/deleteProfile/:id', authController.protect, authController.restrictIfNotAdmin, adminController.deleteUserById);
router.get('/usersFlatCount', authController.protect, authController.restrictIfNotAdmin, adminController.getUsersFlatCount);

module.exports = router;
