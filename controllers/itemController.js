// const Item = require('../models/Item');



// exports.createItem = async (req, res) => {
//   try {
//     const { title, category, size, condition, description, lookingFor } = req.body;

//     const files = req.files || [];
//     const mediaUrls = files
//       .map(file => file.path)
//       .filter(Boolean);

//     const item = await Item.create({
//       user: req.user.id,
//       title,
//       category,
//       size,
//       condition,
//       description,
//       lookingFor,
//       images: mediaUrls.filter(f => /\.(jpg|jpeg|png|gif)$/i.test(f)),
//       videos: mediaUrls.filter(f => /\.(mp4|mov)$/i.test(f))
//     });

//     res.status(201).json(item);
//   } catch (err) {
//     console.error('❌ createItem error:', err);
//     res.status(500).json({ msg: 'Server error' });
//   }
// };




const API_URL = '/api';

async function loadItems() {
  try {
    const res = await fetch(`${API_URL}/items`);
    const items = await res.json();

    const container = document.getElementById('items-container');
    if (!container) return;

    if (items.length === 0) {
      container.innerHTML = '<p>No items yet. Be the first to post!</p>';
      return;
    }

    container.innerHTML = items.map(item => `
      <div class="card">
        <div class="card-header">
          <img src="${item.user?.avatar || 'https://via.placeholder.com/36'}" class="card-avatar">
          <span class="card-username">${item.user?.username || 'Anonymous'}</span>
        </div>
        <img src="${item.images?.[0] || 'https://via.placeholder.com/400x300?text=No+Image'}" 
             alt="${item.title}" 
             class="card-image"
             onerror="this.src='https://via.placeholder.com/400x300?text=No+Image'">
        <div class="card-content">
          <h3 class="card-title">${item.title}</h3>
          <p class="card-detail">Size: ${item.size || 'N/A'}</p>
          <p class="card-detail">Looking for: ${item.lookingFor || 'Anything'}</p>
          <div class="card-actions">
            <a href="item.html?id=${item._id}"><i class="fas fa-eye"></i> View</a>
            <button class="like-btn" data-id="${item._id}"><i class="far fa-heart"></i></button>
            <button class="comment-btn"><i class="far fa-comment"></i></button>
            <button class="share-btn"><i class="far fa-bookmark"></i></button>
          </div>
        </div>
      </div>
    `).join('');

    // Add event listeners for like buttons (placeholder)
    document.querySelectorAll('.like-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        btn.innerHTML = btn.innerHTML.includes('far fa-heart') 
          ? '<i class="fas fa-heart" style="color: red;"></i>' 
          : '<i class="far fa-heart"></i>';
      });
    });

  } catch (err) {
    console.error('Failed to load items:', err);
    document.getElementById('items-container').innerHTML = '<p>Error loading items. Try again later.</p>';
  }
}

loadItems();

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

