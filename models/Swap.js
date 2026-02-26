const mongoose = require('mongoose');

const SwapSchema = new mongoose.Schema({
  itemOffered: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  itemRequested: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  userOffered: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userRequested: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'shipping', 'completed', 'declined', 'cancelled'],
    default: 'pending'
  },
  // Shipping details
  shippedByOffered: { type: Boolean, default: false },
  shippedByRequested: { type: Boolean, default: false },
  trackingOffered: { type: String, default: '' },
  trackingRequested: { type: String, default: '' },
  addressOffered: { type: String, default: '' }, // encrypted later
  addressRequested: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Swap', SwapSchema);