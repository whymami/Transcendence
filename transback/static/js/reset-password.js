document.getElementById('resetPasswordForm').addEventListener('submit', function (event) {
    event.preventDefault();

    const email = document.getElementById('email').value.trim();
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;

    let isValid = true;

    document.getElementById('emailError').textContent = '';
    document.getElementById('newPasswordError').textContent = '';
    document.getElementById('confirmNewPasswordError').textContent = '';
    document.getElementById('successMessage').style.display = 'none';

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        document.getElementById('emailError').textContent = gettext('Please enter a valid email address.');
        isValid = false;
    }

    if (newPassword.length < 6) {
        document.getElementById('newPasswordError').textContent = gettext('Password must be at least 6 characters long.');
        isValid = false;
    }

    if (newPassword !== confirmNewPassword) {
        document.getElementById('confirmNewPasswordError').textContent = gettext('Passwords do not match.');
        isValid = false;
    }

    if (isValid) {
        fetch('/api/reset-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                newPassword: newPassword,
            }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert(gettext('Password reset successful.'));
            } else {
                alert(gettext('Password reset failed: ') + data.message);
            }
        })
        .catch(error => {
            console.error(gettext('Password reset error:'), error);
        }).finally(() => {

        });
    }
});
