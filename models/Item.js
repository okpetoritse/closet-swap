const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  category: String,
  size: String,
  condition: String,
  description: String,
  lookingFor: String,
  images: [String],  // array of Cloudinary URLs
  videos: [String],
  status: { type: String, default: 'available' }, // available, swapped
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Item', ItemSchema);