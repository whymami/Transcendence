function verify2FA() {
    const code = document.getElementById('twoFaCode').value;
    const twoFaError = document.getElementById('twoFaError');

    if (code === "654321") {
        alert("2FA verification successful!");
        window.location.href = '/dashboard';
    } else {
        twoFaError.textContent = "Invalid 2FA code.";
    }
}
