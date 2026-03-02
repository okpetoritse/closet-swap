const Item = require('../models/Item');

// @desc    Create new item
exports.createItem = async (req, res) => {
  try {
    const { title, category, size, condition, description, lookingFor } = req.body;
    const files = req.files;
    const mediaUrls = files ? files.map(file => file.path) : [];

    const item = await Item.create({
      user: req.user.id,
      title,
      category,
      size,
      condition,
      description,
      lookingFor,
      images: mediaUrls.filter(f => f.match(/\.(jpg|jpeg|png|gif)$/i)),
      videos: mediaUrls.filter(f => f.match(/\.(mp4|mov)$/i))
    });

    res.status(201).json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Get all available items
exports.getItems = async (req, res) => {
  try {
    const items = await Item.find({ status: 'available' })
      .populate('user', 'username avatar')
      .sort('-createdAt');
    res.json(items);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Get user's items
exports.getUserItems = async (req, res) => {
  try {
    const items = await Item.find({ user: req.params.userId });
    res.json(items);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Get single item
exports.getItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).populate('user', 'username avatar');
    if (!item) return res.status(404).json({ msg: 'Item not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

