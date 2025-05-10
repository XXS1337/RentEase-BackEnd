const express = require('express');
const router = express.Router();
const multer = require('multer');
const { storage } = require('./../utils/cloudinaryConfig');
const upload = multer({ storage });
const authController = require('./../controllers/AuthController');
const flatController = require('./../controllers/FlatController');

router.get('/', flatController.getAllFlats);
router.post('/', authController.protect, upload.single('image'), flatController.addFlat);
router.delete('/:flatId', authController.protect, flatController.deleteFlat);
router.get('/:flatId', authController.protect, flatController.getFlatById);
router.patch('/:flatId', authController.protect, upload.single('image'), flatController.updateFlat);
router.post('/:flatId/addToFavorites', authController.protect, flatController.addToFavorites);
router.delete('/:flatId/removeFromFavorites', authController.protect, flatController.removeFromFavorites);

module.exports = router;
