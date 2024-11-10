const signForm = document.getElementById("signInForm");
const registerForm = document.getElementById("registerForm");

signForm?.addEventListener("submit", function (e) {
  e.preventDefault(); // block the form submission

  const loginButton = document.getElementById("login-button");
  const email = "test@test.com";
  // document.getElementById('login-email').value.trim();
  const password = "test1234";
  // document.getElementById('login-password').value;

  const url = "/api/login/";

  loginButton.disabled = true;
  loginButton.innerHTML = "Logging in...";

  fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": getCSRFToken(),
    },
    body: JSON.stringify({
      email: email,
      password: password,
    }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Invalid credentials");
      }
      response.json();
    })
    .then((data) => {
      //   alert("Login successful");
      console.log(data);
      showToast("success", "Login successful");
      setTimeout(() => {
        window.location.href = "/";
      }, 1400);
    })
    .catch((error) => {
      showToast("error", "Login failed");
      console.error("Error:", error);
    })
    .finally(() => {
      loginButton.disabled = false;
      loginButton.innerHTML = "Login";
    });
});

function getCSRFToken() {
  const cookieValue = document.cookie
    .split("; ")
    .find((row) => row.startsWith("csrftoken="))
    ?.split("=")[1];
  return cookieValue || "";
}

registerForm?.addEventListener("submit", function (event) {
  event.preventDefault();

  const username = document.getElementById("register-username").value;
  const email = document.getElementById("register-email").value;
  const password = document.getElementById("register-password").value;

  const url = "/api/register/";

  fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": getCSRFToken(),
    },
    body: JSON.stringify({
      username: username,
      email: email,
      password: password,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      alert("Registration successful");
      console.log("Success:", data);
    })
    .catch((error) => {
      alert("Registration failed");
      console.error("Error:", error);
    });
});

// togglePanel function is used to toggle the right panel in the login page
function togglePanel(toggle) {
  const container = document.getElementById("container");
  if (toggle) container.classList.add("right-panel-active");
  else container.classList.remove("right-panel-active");
}
