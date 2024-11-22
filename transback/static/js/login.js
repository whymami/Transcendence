{
  fetchIcons();

  function fetchIcons(passType = "password") {
    const toggleButton = document.getElementById("togglePassword");
    const svgPath = passType === "password" ? "/static/images/eye.svg" : "/static/images/eye-slash.svg";

    fetch(svgPath)
      .then(response => response.text())
      .then(data => {
        toggleButton.innerHTML = data;
      })
      .catch(error => console.error('Error:', error));
  }

  function togglePassword() {
    const passwordField = document.getElementById("password");
    passwordField.type = passwordField.type === "password" ? "text" : "password";
    fetchIcons(passwordField.type);
  }
}

async function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  const emailError = document.getElementById("emailError");
  const passwordError = document.getElementById("passwordError");
  const generalError = document.getElementById("generalError");

  emailError.textContent = "";
  passwordError.textContent = "";
  generalError.textContent = "";

  let isValid = true;

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    emailError.textContent = "Please enter a valid email address.";
    isValid = false;
  }

  if (password.length < 6) {
    passwordError.textContent = "Password must be at least 4 characters long.";
    isValid = false;
  }

  if (!isValid) return;

  try {
    const response = await fetch('/api/login/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    if (!response.ok) {
      showToast('error', data?.error);
      return;
    }
    
    setCookie('access_token', data.access, 1);
    setCookie('refresh_token', data.refresh, 1);

    showToast('success', data.massage);
    window.location.href = '/';
    pullHeader(true);

  } catch (error) {
    console.error('Error:', error);
    showToast('error', 'An error occurred while logging in.');
  }
}
