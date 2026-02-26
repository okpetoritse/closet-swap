// Update navigation based on login status
const token = localStorage.getItem('token');
const loginLink = document.getElementById('login-link');
const logoutLink = document.getElementById('logout-link');

if (token) {
  if (loginLink) loginLink.style.display = 'none';
  if (logoutLink) logoutLink.style.display = 'flex';
} else {
  if (loginLink) loginLink.style.display = 'flex';
  if (logoutLink) logoutLink.style.display = 'none';
}

if (logoutLink) {
  logoutLink.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('token');
    window.location.href = 'index.html';
  });
}