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
            .catch(error => console.error('SVG yüklenirken hata oluştu:', error));
    }

    function togglePassword() {
        const passwordField = document.getElementById("password");
        const confirmPasswordField = document.getElementById("confirm-password");
        const type = passwordField.type === "password" ? "text" : "password";
        passwordField.type = type;
        confirmPasswordField.type = type;
        fetchIcons(type);
    }
}

async function register() {
    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const confirmPassword = document.getElementById("confirm-password").value.trim();

    // Hata mesajları alanları
    const usernameError = document.getElementById("usernameError");
    const emailError = document.getElementById("emailError");
    const passwordError = document.getElementById("passwordError");
    const confirmPasswordError = document.getElementById("confirmPasswordError");
    const generalError = document.getElementById("generalError");

    // Hata mesajlarını sıfırla
    usernameError.textContent = "";
    emailError.textContent = "";
    passwordError.textContent = "";
    confirmPasswordError.textContent = "";
    generalError.textContent = "";

    // Validasyon Kontrolü
    let isValid = true;

    if (username.length < 4) {
        usernameError.textContent = "Username must be at least 4 characters long.";
        isValid = false;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        emailError.textContent = "Please enter a valid email address.";
        isValid = false;
    }

    if (password.length < 6) {
        passwordError.textContent = "Password must be at least 6 characters long.";
        isValid = false;
    }

    if (password !== confirmPassword) {
        confirmPasswordError.textContent = "Passwords do not match.";
        isValid = false;
    }

    if (!isValid) return;

    try {
        const response = await fetch('/api/register/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });

        if (!response.ok) {
            const errorData = await response.json();
            showToast('error', errorData.message || 'Registration failed.');
            return;
        }

        const data = await response.json();
        showToast('success', 'Registration successful. Redirecting...');
        window.location.href = '/login';

    } catch (error) {
        console.error('Error:', error);
        generalError.textContent = 'An error occurred. Please try again later.';
    }
}
