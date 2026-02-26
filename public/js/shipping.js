const API_URL = 'http://localhost:5000/api';
const urlParams = new URLSearchParams(window.location.search);
const swapId = urlParams.get('id');

if (!swapId) {
  window.location.href = 'swaps.html';
}

async function loadShipping() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  try {
    // Fetch swap details
    const res = await fetch(`${API_URL}/swaps/${swapId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Could not load swap');
    const swap = await res.json();

    // Get current user
    const userRes = await fetch(`${API_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const user = await userRes.json();

    const isOfferedUser = swap.userOffered._id === user._id;
    const myShipped = isOfferedUser ? swap.shippedByOffered : swap.shippedByRequested;
    const otherShipped = isOfferedUser ? swap.shippedByRequested : swap.shippedByOffered;

    let html = `
      <h2>Shipping for Swap</h2>
      <div class="card">
        <div class="card-content">
          <p><strong>Item you ${isOfferedUser ? 'offer' : 'request'}:</strong> ${isOfferedUser ? swap.itemOffered.title : swap.itemRequested.title}</p>
          <p><strong>Status:</strong> ${swap.status}</p>
          <p><strong>You have shipped:</strong> ${myShipped ? '✅ Yes' : '❌ No'}</p>
          <p><strong>Other user has shipped:</strong> ${otherShipped ? '✅ Yes' : '❌ No'}</p>
    `;

    if (!myShipped) {
      // Show form to enter tracking
      html += `
        <h3>Mark as Shipped</h3>
        <form id="ship-form">
          <div class="form-group">
            <label for="tracking">Tracking Number</label>
            <input type="text" id="tracking" class="form-control" required>
          </div>
          <button type="submit" class="btn">I've Shipped</button>
        </form>
      `;
    } else if (myShipped && otherShipped) {
      // Both shipped – fetch and display address
      const addrRes = await fetch(`${API_URL}/swaps/${swapId}/address`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (addrRes.ok) {
        const addrData = await addrRes.json();
        html += `
          <h3>Shipping Address</h3>
          <p>Send your item to:</p>
          <div class="card">
            <pre>${addrData.address}</pre>
          </div>
        `;
      } else {
        html += `<p>Address not available yet.</p>`;
      }
    } else {
      html += `<p>Waiting for the other user to ship.</p>`;
    }

    html += `</div></div>`;
    document.getElementById('shipping-details').innerHTML = html;

    // Attach submit handler if form exists
    document.getElementById('ship-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const tracking = document.getElementById('tracking').value;
      const shipRes = await fetch(`${API_URL}/swaps/${swapId}/ship`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ trackingNumber: tracking })
      });
      if (shipRes.ok) {
        alert('Shipping confirmed!');
        loadShipping(); // reload to update UI
      } else {
        const err = await shipRes.json();
        alert(err.msg || 'Error updating shipping');
      }
    });
  } catch (err) {
    console.error(err);
    document.getElementById('shipping-details').innerHTML = '<p>Error loading shipping details.</p>';
  }
}

loadShipping();