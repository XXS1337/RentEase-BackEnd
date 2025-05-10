const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
require('dotenv').config();

//* Configuring Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

//* Cloudinary Storage instance
const storage = new CloudinaryStorage({
  cloudinary,
  allowed_formats: ['jpg', 'png', 'jpeg'],
  params: {
    folder: 'flatImages',
    format: 'jpg',
    transformation: [{ width: 800, height: 800, crop: 'limit' }],
  },
});

module.exports = { storage };
