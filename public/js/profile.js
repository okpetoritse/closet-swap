const API_URL = '/api';

async function loadProfile() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  try {
    const userRes = await fetch(`${API_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!userRes.ok) throw new Error('Not authorized');
    const user = await userRes.json();

    const itemsRes = await fetch(`${API_URL}/items/user/${user._id}`);
    const items = await itemsRes.json();

    // Profile header
    document.getElementById('profile-header').innerHTML = `
      <img src="${user.avatar || 'https://via.placeholder.com/120'}" class="profile-avatar">
      <div>
        <h2>${user.username}</h2>
        <div class="profile-stats">
          <div><span class="number">${items.length}</span><span class="label"> posts</span></div>
          <div><span class="number">0</span><span class="label"> swaps</span></div>
          <div><span class="number">0</span><span class="label"> followers</span></div>
        </div>
        <p>${user.email}</p>
        <p>Member since ${new Date(user.createdAt).toLocaleDateString()}</p>
      </div>
    `;

    // Items grid
    const container = document.getElementById('user-items');
    if (items.length === 0) {
      container.innerHTML = '<p>You haven’t posted any items yet.</p>';
    } else {
      container.innerHTML = items.map(item => `
        <div class="card">
          <img src="${item.images?.[0] || 'https://via.placeholder.com/400x300'}" class="card-image">
          <div class="card-content">
            <h4>${item.title}</h4>
            <p class="card-detail">Status: ${item.status}</p>
            <div class="card-actions">
              <a href="item.html?id=${item._id}"><i class="fas fa-eye"></i> View</a>
            </div>
          </div>
        </div>
      `).join('');
    }
  } catch (err) {
    console.error(err);
    localStorage.removeItem('token');
    window.location.href = 'login.html';
  }
}

document.getElementById('logout-btn').addEventListener('click', () => {
  localStorage.removeItem('token');
  window.location.href = 'index.html';
});

loadProfile();