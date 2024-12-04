document.getElementById('resetPasswordForm').addEventListener('submit', async function (event) {
    event.preventDefault();

    const currentPassword = document.getElementById('currentPassword');
    const newPassword = document.getElementById('newPassword');
    const confirmNewPassword = document.getElementById('confirmNewPassword');
    const currentPasswordValue = currentPassword.value.trim();
    const newPasswordValue = newPassword.value.trim();
    const confirmNewPasswordValue = confirmNewPassword.value.trim();
    const currentPasswordError = document.getElementById('currentPasswordError');
    const newPasswordError = document.getElementById('newPasswordError');
    const confirmNewPasswordError = document.getElementById('confirmNewPasswordError');
    let isValid = true;

    currentPasswordError.textContent = '';
    newPasswordError.textContent = '';
    confirmNewPasswordError.textContent = '';
    successMessage.style.display = 'none';

    if (!currentPasswordValue) {
        document.getElementById('currentPasswordError').textContent = 'Please enter your current password.';
        isValid = false;
    }

    if (newPasswordValue.length < 6) {
        newPasswordError.textContent = 'Password must be at least 6 characters long.';
        isValid = false;
    }

    if (newPasswordValue !== confirmNewPasswordValue) {
        confirmNewPasswordError.textContent = 'Passwords do not match.';
        isValid = false;
    }

    const token = await getAccessToken();

    if (isValid) {
        try {
            const response = await fetch('/api/reset-password/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    old_password: currentPasswordValue,
                    new_password: newPasswordValue,
                }),
            });
            const data = await response.json();
            if (response.ok) {
                showToast('success', 'Password reset successful.');
            } else {
                showToast('error', data.error);
            }
        } catch (error) {
            console.error('Password reset error:', error);
        }
    }
});

{
    fetchIcons('password', 'currentPasswordToggle');
    fetchIcons('password', 'newPasswordToggle');
    fetchIcons('password', 'confirmNewPasswordToggle');

    function fetchIcons(passType = "password", id) {
        const toggleButton = document.getElementById(id);
        
        const svgPath = passType === "password" ? "/static/images/eye.svg" : "/static/images/eye-slash.svg";
        
        fetch(svgPath)
            .then(response => response.text())
            .then(data => {
                toggleButton.innerHTML = data;
            })
            .catch(error => console.error('Simge yüklenirken hata:', error));
    }

    function togglePassword_reset(id) {
        const passwordField = document.getElementById(id);
        passwordField.type = passwordField.type === "password" ? "text" : "password";
        fetchIcons(passwordField.type, id + 'Toggle');
    }
}