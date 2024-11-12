fetchIcons();

function fetchIcons(passType = "password") {
  const toggleButton = document.getElementById("togglePassword");
  const svgPath = passType === "password" ? "/static/images/eye.svg" : "/static/images/eye-slash.svg";

  fetch(svgPath)
    .then(response => response.text())
    .then(data => {
      console.log('SVG yüklendi:', data);
      toggleButton.innerHTML = data
    })
    .catch(error => console.error('SVG yüklenirken hata oluştu:', error));
}

function togglePassword() {
  const passwordField = document.getElementById("password");
  passwordField.type = passwordField.type === "password" ? "text" : "password";
  fetchIcons(passwordField.type);
}

async function login() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const rememberMe = document.getElementById("remember").checked;

  const usernameError = document.getElementById("usernameError");
  const passwordError = document.getElementById("passwordError");
  const generalError = document.getElementById("generalError");

  usernameError.textContent = "";
  passwordError.textContent = "";
  generalError.textContent = "";

  let isValid = true;
  if (username.length < 4) {
    usernameError.textContent = "Username must be at least 4 characters long.";
    isValid = false;
  }
  if (password.length < 4) {
    passwordError.textContent = "Password must be at least 4 characters long.";
    isValid = false;
  }

  if (!isValid) return; 

  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (response.ok) {
      const data = await response.json();

      // access_token ve refresh_token'ları cookie olarak kaydet
      setCookie('access_token', data.access_token, rememberMe ? 7 : 1);
      setCookie('refresh_token', data.refresh_token, rememberMe ? 7 : 1);

      showToast('success', 'Login successful. Redirecting...');
      window.location.href = '/dashboard';
    } else {
      const error = await response.json();
      generalError.textContent = error.message || 'Login failed. Please try again.';
    }
  } catch (error) {
    console.error('Error:', error);
    generalError.textContent = 'An error occurred. Please try again later.';
  }
}
