function verifyEmail() {
    const code = document.getElementById('verificationCode').value;
    const verificationError = document.getElementById('verificationError');

    if (code === "123456") {
        alert("Email verified successfully!");
        window.location.href = '/2fa';
    } else {
        verificationError.textContent = "Invalid verification code.";
    }
}
