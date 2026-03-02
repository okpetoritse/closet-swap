const API_URL = '/api';
const urlParams = new URLSearchParams(window.location.search);
const itemId = urlParams.get('id');

if (!itemId) {
  document.getElementById('item-detail').innerHTML = '<p>No item specified.</p>';
} else {
  loadItem(itemId);
}

async function loadItem(id) {
  try {
    const res = await fetch(`${API_URL}/items/${id}`);
    if (!res.ok) throw new Error('Item not found');
    const item = await res.json();

    // Display item details
    const detailDiv = document.getElementById('item-detail');
    detailDiv.innerHTML = `
      <div class="item-detail-card">
        <div class="item-images">
          ${item.images.map(img => `<img src="${img}" alt="${item.title}" class="item-image">`).join('')}
        </div>
        <div class="item-info">
          <h2>${item.title}</h2>
          <p><strong>Category:</strong> ${item.category}</p>
          <p><strong>Size:</strong> ${item.size}</p>
          <p><strong>Condition:</strong> ${item.condition}</p>
          <p><strong>Description:</strong> ${item.description}</p>
          <p><strong>Looking for:</strong> ${item.lookingFor}</p>
          <p><strong>Posted by:</strong> ${item.user?.username || 'Unknown'}</p>
        </div>
      </div>
    `;

    // Check login and show offer button
    const token = localStorage.getItem('token');
    if (token) {
      // Don't show offer button if it's the user's own item
      const userRes = await fetch(`${API_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const user = await userRes.json();
      if (user._id !== item.user?._id) {
        document.getElementById('offer-section').innerHTML = `
          <button id="offer-btn" class="btn btn-secondary">Offer Swap</button>
        `;
        document.getElementById('offer-btn').addEventListener('click', () => showOfferModal(item));
      }
    } else {
      document.getElementById('offer-section').innerHTML = `<p><a href="login.html">Log in</a> to offer a swap.</p>`;
    }
  } catch (err) {
    console.error(err);
    document.getElementById('item-detail').innerHTML = '<p>Error loading item.</p>';
  }
}

async function showOfferModal(requestedItem) {
  const token = localStorage.getItem('token');
  if (!token) return;

  // Fetch user's own available items
  const userRes = await fetch(`${API_URL}/auth/me`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const user = await userRes.json();

  const itemsRes = await fetch(`${API_URL}/items/user/${user._id}`);
  const items = await itemsRes.json();
  const availableItems = items.filter(item => item.status === 'available');

  const modal = document.getElementById('offer-modal');
  const list = document.getElementById('user-items-list');
  const closeBtn = document.querySelector('.close-modal');

  if (availableItems.length === 0) {
    list.innerHTML = '<p>You have no available items to offer. <a href="post.html">Post one now</a>.</p>';
  } else {
    list.innerHTML = availableItems.map(item => `
      <div class="card" data-item-id="${item._id}" style="cursor: pointer;">
        <img src="${item.images?.[0] || 'https://via.placeholder.com/200'}" class="card-image">
        <div class="card-content">
          <h4>${item.title}</h4>
          <p class="card-detail">${item.size}</p>
        </div>
      </div>
    `).join('');

    // Add click event to each item card
    document.querySelectorAll('#user-items-list .card').forEach(card => {
      card.addEventListener('click', async () => {
        const offeredItemId = card.dataset.itemId;
        const res = await fetch(`${API_URL}/swaps`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            itemOffered: offeredItemId,
            itemRequested: requestedItem._id
          })
        });

        if (res.ok) {
          alert('Swap offer sent!');
          modal.style.display = 'none';
        } else {
          const data = await res.json();
          alert(data.msg || 'Failed to send offer');
        }
      });
    });
  }

  modal.style.display = 'flex';

  // Close modal when clicking on X or outside
  closeBtn.onclick = () => {
    modal.style.display = 'none';
  };
  window.onclick = (event) => {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  };
}

// Cancel button inside modal
document.getElementById('cancel-offer')?.addEventListener('click', () => {
  document.getElementById('offer-modal').style.display = 'none';
});