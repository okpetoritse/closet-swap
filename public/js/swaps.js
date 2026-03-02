const API_URL = '/api';
let currentView = 'incoming'; // 'incoming' or 'outgoing'

async function loadSwaps() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  try {
    const res = await fetch(`${API_URL}/swaps`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const swaps = await res.json();

    const userRes = await fetch(`${API_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const user = await userRes.json();

    let filteredSwaps;
    if (currentView === 'incoming') {
      filteredSwaps = swaps.filter(swap => swap.userRequested._id === user._id);
    } else {
      filteredSwaps = swaps.filter(swap => swap.userOffered._id === user._id);
    }

    displaySwaps(filteredSwaps);
  } catch (err) {
    console.error(err);
    document.getElementById('swaps-container').innerHTML = '<p>Error loading swaps.</p>';
  }
}

function displaySwaps(swaps) {
  const container = document.getElementById('swaps-container');
  
  if (swaps.length === 0) {
    container.innerHTML = '<p>No swaps found.</p>';
    return;
  }

  container.innerHTML = swaps.map(swap => `
    <div class="card" data-swap-id="${swap._id}">
      <div class="card-header">
        <img src="${swap.itemRequested?.user?.avatar || 'https://via.placeholder.com/36'}" class="card-avatar">
        <span class="card-username">${swap.itemRequested?.user?.username}</span>
      </div>
      <div style="display: flex; gap: 1rem; padding: 1rem;">
        <div style="flex: 1;">
          <img src="${swap.itemOffered?.images?.[0] || 'https://via.placeholder.com/150'}" style="width: 100%; border-radius: var(--border-radius);">
          <p><strong>You offer:</strong> ${swap.itemOffered?.title}</p>
        </div>
        <div style="flex: 1;">
          <img src="${swap.itemRequested?.images?.[0] || 'https://via.placeholder.com/150'}" style="width: 100%; border-radius: var(--border-radius);">
          <p><strong>For:</strong> ${swap.itemRequested?.title}</p>
        </div>
      </div>
      <div class="card-content">
        <p><strong>Status:</strong> <span class="swap-status">${swap.status}</span></p>
        <div class="swap-actions">
          ${renderActions(swap)}
        </div>
      </div>
    </div>
  `).join('');

  document.querySelectorAll('.accept-swap').forEach(btn => {
    btn.addEventListener('click', () => updateSwapStatus(btn.dataset.swapId, 'accepted'));
  });
  document.querySelectorAll('.decline-swap').forEach(btn => {
    btn.addEventListener('click', () => updateSwapStatus(btn.dataset.swapId, 'declined'));
  });
}

function renderActions(swap) {
  const token = localStorage.getItem('token');
  if (!token) return '';

  // 🔁 Show Shipping button for accepted or shipping status
  if (swap.status === 'accepted' || swap.status === 'shipping') {
    return `<a href="shipping.html?id=${swap._id}" class="btn">Shipping</a>`;
  }

  // For incoming pending swaps, show accept/decline
  if (currentView === 'incoming' && swap.status === 'pending') {
    return `
      <button class="btn accept-swap" data-swap-id="${swap._id}">Accept</button>
      <button class="btn btn-outline decline-swap" data-swap-id="${swap._id}">Decline</button>
    `;
  }

  // Default: show status badge
  return `<span class="badge">${swap.status}</span>`;
}

async function updateSwapStatus(swapId, status) {
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`${API_URL}/swaps/${swapId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    });

    if (res.ok) {
      alert(`Swap ${status}!`);
      loadSwaps();
    } else {
      const data = await res.json();
      alert(data.msg || 'Failed to update swap');
    }
  } catch (err) {
    console.error(err);
    alert('Network error');
  }
}

document.getElementById('show-incoming')?.addEventListener('click', () => {
  currentView = 'incoming';
  loadSwaps();
});

document.getElementById('show-outgoing')?.addEventListener('click', () => {
  currentView = 'outgoing';
  loadSwaps();
});


// Filter out declined/cancelled from main view (optional)
const activeStatuses = ['pending', 'accepted', 'shipping', 'completed']; // adjust as needed
const activeSwaps = swaps.filter(swap => activeStatuses.includes(swap.status));

let filteredSwaps;
if (currentView === 'incoming') {
  filteredSwaps = activeSwaps.filter(swap => swap.userRequested._id === user._id);
} else {
  filteredSwaps = activeSwaps.filter(swap => swap.userOffered._id === user._id);
}

loadSwaps();