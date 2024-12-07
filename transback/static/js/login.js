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
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();
  const loginBtn = document.getElementsByClassName("login-btn")[0];

  const usernameError = document.getElementById("usernameError");
  const passwordError = document.getElementById("passwordError");
  const generalError = document.getElementById("generalError");

  usernameError.textContent = "";
  passwordError.textContent = "";
  generalError.textContent = "";

  let isValid = true;

  if (username.length < 4) {
    usernameError.textContent = gettext("Username must be at least 4 characters long.");
    isValid = false;
  }

  if (username.length > 10) {
    usernameError.textContent = gettext("Username must be less than 10 characters.");
    isValid = false;
  }

  // const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  // if (!emailPattern.test(email)) {
  //   emailError.textContent = "Please enter a valid email address.";
  //   isValid = false;
  // }

  if (password.length < 6) {
    passwordError.textContent = gettext("Password must be at least 6 characters long.");
    isValid = false;
  }

  if (!isValid) return;
  const lang = await getCookie('lang') || 'en-US';

  try {
    loginBtn.textContent = gettext("Loading...");
    loginBtn.disabled = true;
    passwordInput.disabled = true;
    usernameInput.disabled = true;
    const response = await fetch('/api/login/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        "Accept-Language": lang,

      },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();
    if (!response.ok) {
      showToast('error', data?.error || data?.message || data || gettext('An error occurred while logging in.'));
      return;
    }

    localStorage.setItem('username', username);

    showToast('success', data?.message || data);
    history.pushState({}, "", "/2fa");
    urlLocationHandler();

  } catch (error) {
    console.error('Error:', error?.message);
    showToast('error', error?.error || error?.message || error || gettext('An error occurred while logging in.'));
  } finally {
    loginBtn.textContent = gettext("Login");
    loginBtn.disabled = false;
    passwordInput.disabled = false;
    usernameInput.disabled = false;
  }
}
