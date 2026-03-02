const API_URL = '/api';

document.getElementById('post-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const token = localStorage.getItem('token');
  if (!token) {
    alert('You must be logged in to post.');
    window.location.href = 'login.html';
    return;
  }

  const formData = new FormData();
  formData.append('title', document.getElementById('title').value);
  formData.append('category', document.getElementById('category').value);
  formData.append('size', document.getElementById('size').value);
  formData.append('condition', document.getElementById('condition').value);
  formData.append('description', document.getElementById('description').value);
  formData.append('lookingFor', document.getElementById('looking-for').value);

  const fileInput = document.getElementById('media');
  for (let i = 0; i < fileInput.files.length; i++) {
    formData.append('media', fileInput.files[i]);
  }

  try {
    const res = await fetch(`${API_URL}/items`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
        // Do NOT set Content-Type – browser sets it automatically with boundary for multipart
      },
      body: formData
    });

    const data = await res.json();

    if (res.ok) {
      alert('Item posted successfully!');
      window.location.href = 'browse.html';
    } else {
      alert(data.msg || 'Failed to post item');
    }
  } catch (err) {
    console.error(err);
    alert('Network error');
  }
});