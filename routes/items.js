const express = require('express');
const router = express.Router();
const { createItem, getItems, getUserItems, getItem } = require('../controllers/itemController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../config/cloudinary');

router.route('/')
  .get(getItems)
  .post(protect, upload.array('media', 5), createItem);

router.get('/user/:userId', getUserItems);
router.get('/:id', getItem);

module.exports = router;