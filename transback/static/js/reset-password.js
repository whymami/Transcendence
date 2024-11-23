document.getElementById('resetPasswordForm').addEventListener('submit', function (event) {
    event.preventDefault();

    const email = document.getElementById('email').value.trim();
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;

    let isValid = true;

    // Hataları temizleme
    document.getElementById('emailError').textContent = '';
    document.getElementById('newPasswordError').textContent = '';
    document.getElementById('confirmNewPasswordError').textContent = '';
    document.getElementById('successMessage').style.display = 'none';

    // Email doğrulaması
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        document.getElementById('emailError').textContent = 'Geçerli bir email adresi giriniz.';
        isValid = false;
    }

    // Yeni şifre uzunluk kontrolü
    if (newPassword.length < 6) {
        document.getElementById('newPasswordError').textContent = 'Şifre en az 6 karakter olmalıdır.';
        isValid = false;
    }

    // Şifrelerin eşleşme kontrolü
    if (newPassword !== confirmNewPassword) {
        document.getElementById('confirmNewPasswordError').textContent = 'Şifreler eşleşmiyor.';
        isValid = false;
    }

    if (isValid) {
        // Başarılı durum
        document.getElementById('successMessage').style.display = 'block';

        // Backend API'ye gönderme (örnek POST isteği)
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
                alert('Şifre başarıyla sıfırlandı.');
            } else {
                alert('Şifre sıfırlama başarısız: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Şifre sıfırlama hatası:', error);
        });
    }
});
