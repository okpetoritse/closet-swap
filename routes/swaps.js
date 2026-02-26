const express = require('express');
const router = express.Router();
const {
  createSwap,
  getUserSwaps,
  getSwap,
  updateSwapStatus,
  deleteSwap,
  markAsShipped,    // <-- add this
  getAddress        // <-- add this
} = require('../controllers/swapController');
const { protect } = require('../middleware/authMiddleware');

// All swap routes are protected
router.use(protect);

router.post('/', createSwap);
router.get('/', getUserSwaps);
router.get('/:id', getSwap);
router.put('/:id', updateSwapStatus);
router.delete('/:id', deleteSwap);

// New shipping routes
router.put('/:id/ship', protect, markAsShipped);
router.get('/:id/address', protect, getAddress);

module.exports = router;