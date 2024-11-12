

function togglePassword() {
    const passwordField = document.getElementById("password");
    const confirmPasswordField = document.getElementById("confirm-password");
    const type = passwordField.type === "password" ? "text" : "password";

    passwordField.type = type;
    confirmPasswordField.type = type;
}

function register() {
    // Kayıt işlemini burada yapın
    const username = document.getElementById("username").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirm-password").value;

    if (password !== confirmPassword) {
        alert("Passwords do not match.");
        return;
    }

    // API'ye veya backend'e veri gönderme işlemi burada yapılabilir
    console.log("User Registered:", { username, email, password });
}
