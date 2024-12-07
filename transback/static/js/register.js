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
            .catch(error => console.error(gettext('Error loading SVG:'), error));
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

    const registerBtn = document.querySelector(".register-btn");
    const inputs = document.querySelectorAll("input");

    // Hata mesajlarını sıfırla
    usernameError.textContent = "";
    emailError.textContent = "";
    passwordError.textContent = "";
    confirmPasswordError.textContent = "";
    generalError.textContent = "";

    // Validasyon Kontrolü
    let isValid = true;

    if (username.length < 4) {
        usernameError.textContent = gettext("Username must be at least 4 characters long.");
        isValid = false;
    }

    if (username.length > 10) {
        usernameError.textContent = gettext("Username must be less than 10 characters.");
        isValid = false;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        emailError.textContent = gettext("Please enter a valid email address.");
        isValid = false;
    }

    if (password.length < 6) {
        passwordError.textContent = gettext("Password must be at least 6 characters long.");
        isValid = false;
    }

    if (password !== confirmPassword) {
        confirmPasswordError.textContent = gettext("Passwords do not match.");
        isValid = false;
    }

    if (!isValid) return;
    const lang = await getCookie('lang') || 'en-US';

    try {
        // **Loading Durumuna Geçiş**
        registerBtn.textContent = gettext("Loading...");
        registerBtn.disabled = true;
        inputs.forEach(input => input.disabled = true);

        const response = await fetch('/api/register/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json', "Accept-Language": lang,
            },
            body: JSON.stringify({ username, email, password })
        });

        if (!response.ok) {
            const errorData = await response.json();
            showToast('error', errorData?.error || errorData?.message || errorData || gettext('error'));
            return;
        }

        const data = await response.json();
        showToast('success', data?.message || data || gettext('error'));
        localStorage.setItem("username", username);

        setTimeout(() => {
            history.pushState({}, "", "/verify");
            urlLocationHandler();
        }, 2000);

    } catch (error) {
        console.error('Error:', error);
        generalError.textContent = error?.error || error?.message || error || gettext('error');
    } finally {
        registerBtn.textContent = gettext("Register");
        registerBtn.disabled = false;
        inputs.forEach(input => input.disabled = false);
    }
}
