const Swap = require('../models/Swap');
const Item = require('../models/Item');

// @desc    Create a new swap offer
// @route   POST /api/swaps
exports.createSwap = async (req, res) => {
  try {
    const { itemOffered, itemRequested } = req.body;

    // Verify both items exist
    const offeredItem = await Item.findById(itemOffered);
    const requestedItem = await Item.findById(itemRequested);

    if (!offeredItem || !requestedItem) {
      return res.status(404).json({ msg: 'Item not found' });
    }

    // Check that the user making the offer owns the offered item
    if (offeredItem.user.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'You can only offer your own items' });
    }

    // Check that the requested item is available
    if (requestedItem.status !== 'available') {
      return res.status(400).json({ msg: 'Item is no longer available' });
    }

    // Create swap
    const swap = await Swap.create({
      itemOffered,
      itemRequested,
      userOffered: req.user.id,
      userRequested: requestedItem.user
    });

    // Optionally, update item status to 'pending' or similar
    // await Item.findByIdAndUpdate(itemOffered, { status: 'pending' });

    res.status(201).json(swap);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Get all swaps for the logged-in user
// @route   GET /api/swaps
exports.getUserSwaps = async (req, res) => {
  try {
    const swaps = await Swap.find({
      $or: [{ userOffered: req.user.id }, { userRequested: req.user.id }]
    })
      .populate('itemOffered')
      .populate('itemRequested')
      .populate('userOffered', 'username')
      .populate('userRequested', 'username')
      .sort('-createdAt');

    res.json(swaps);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Get a single swap
// @route   GET /api/swaps/:id
exports.getSwap = async (req, res) => {
  try {
    const swap = await Swap.findById(req.params.id)
      .populate('itemOffered')
      .populate('itemRequested')
      .populate('userOffered', 'username')
      .populate('userRequested', 'username');

    if (!swap) return res.status(404).json({ msg: 'Swap not found' });

    // Ensure the user is part of the swap
    if (swap.userOffered._id.toString() !== req.user.id &&
        swap.userRequested._id.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    res.json(swap);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Update swap status (accept/decline/cancel)
// @route   PUT /api/swaps/:id
exports.updateSwapStatus = async (req, res) => {
  try {
    const { status } = req.body; // 'accepted', 'declined', 'cancelled', etc.
    const swap = await Swap.findById(req.params.id);

    if (!swap) return res.status(404).json({ msg: 'Swap not found' });

    // Only the recipient can accept/decline; the offerer can cancel
    if (status === 'accepted' || status === 'declined') {
      if (swap.userRequested.toString() !== req.user.id) {
        return res.status(403).json({ msg: 'Not authorized' });
      }
    } else if (status === 'cancelled') {
      if (swap.userOffered.toString() !== req.user.id) {
        return res.status(403).json({ msg: 'Only the offerer can cancel' });
      }
    }

    swap.status = status;
    await swap.save();

    if (status === 'accepted') {
  await Item.findByIdAndUpdate(swap.itemOffered, { status: 'swapped' });
  await Item.findByIdAndUpdate(swap.itemRequested, { status: 'swapped' });

  // Decline all other pending offers on both items
  await Swap.updateMany(
    { 
      $or: [
        { itemOffered: swap.itemOffered },
        { itemRequested: swap.itemOffered },
        { itemOffered: swap.itemRequested },
        { itemRequested: swap.itemRequested }
      ],
      status: 'pending',
      _id: { $ne: swap._id } // exclude the accepted swap
    },
    { status: 'declined' }
  );
}

    res.json(swap);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Delete a swap (optional)
// @route   DELETE /api/swaps/:id
exports.deleteSwap = async (req, res) => {
  try {
    const swap = await Swap.findById(req.params.id);
    if (!swap) return res.status(404).json({ msg: 'Swap not found' });

    // Only the offerer or recipient can delete? Or admin?
    if (swap.userOffered.toString() !== req.user.id && swap.userRequested.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    await swap.deleteOne();
    res.json({ msg: 'Swap removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Mark that the current user has shipped their item
// @route   PUT /api/swaps/:id/ship
exports.markAsShipped = async (req, res) => {
  try {
    const { trackingNumber } = req.body;
    const swap = await Swap.findById(req.params.id);
    if (!swap) return res.status(404).json({ msg: 'Swap not found' });

    // Determine which user is making the request
    const isOfferedUser = swap.userOffered.toString() === req.user.id;
    const isRequestedUser = swap.userRequested.toString() === req.user.id;

    if (!isOfferedUser && !isRequestedUser) {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    // Update shipping status and tracking
    if (isOfferedUser) {
      swap.shippedByOffered = true;
      swap.trackingOffered = trackingNumber;
    } else {
      swap.shippedByRequested = true;
      swap.trackingRequested = trackingNumber;
    }

    // If both have shipped, update status to 'shipping' (or keep as is)
    if (swap.shippedByOffered && swap.shippedByRequested) {
      swap.status = 'shipping';
      // Here you could also reveal addresses (we'll handle in a separate endpoint)
    }

    await swap.save();
    res.json({ msg: 'Shipping status updated', swap });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Get the other user's address (only if both have shipped)
// @route   GET /api/swaps/:id/address
exports.getAddress = async (req, res) => {
  try {
    const swap = await Swap.findById(req.params.id);
    if (!swap) return res.status(404).json({ msg: 'Swap not found' });

    const isOfferedUser = swap.userOffered.toString() === req.user.id;
    const isRequestedUser = swap.userRequested.toString() === req.user.id;

    if (!isOfferedUser && !isRequestedUser) {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    // Check if both have shipped
    if (!swap.shippedByOffered || !swap.shippedByRequested) {
      return res.status(400).json({ msg: 'Both users must ship first' });
    }

    // Return the other user's address
    const otherUserId = isOfferedUser ? swap.userRequested : swap.userOffered;
    const otherUser = await User.findById(otherUserId).select('address'); // Assume User model has address field
    res.json({ address: otherUser.address });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};