const express = require('express');
const router = express.Router();
const { upload } = require('../config/cloudinary');
const { verifyToken } = require('../middlewares/authMiddleware');

/**
 * @swagger
 * /api/upload:
 *   post:
 *     summary: Upload an image file to Cloudinary
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Image uploaded successfully, returns secure URL
 *       400:
 *         description: No file uploaded
 *       500:
 *         description: Upload failed
 */
router.post('/', verifyToken, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }
    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully.',
      data: {
        url: req.file.path,
        filename: req.file.filename,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Upload failed', error: error.message });
  }
});

module.exports = router;
