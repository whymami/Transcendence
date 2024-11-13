// Hata mesajını gösterme fonksiyonu
function showError(elementId, message) {
    document.getElementById(elementId).textContent = message;
}

// Hata mesajını temizleme fonksiyonu
function clearError(elementId) {
    document.getElementById(elementId).textContent = '';
}

document.getElementById('changePasswordForm').addEventListener('submit', function (event) {
    event.preventDefault();

    const currentPassword = document.getElementById('currentPassword').value.trim();
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;

    let isValid = true;

    clearError('currentPasswordError');
    clearError('newPasswordError');
    clearError('confirmNewPasswordError');

    // Şu anki şifrenin doğruluğunu kontrol et (örneğin, min 6 karakter)
    if (currentPassword.length < 6) {
        showError('currentPasswordError', 'Geçerli şifre en az 6 karakter olmalıdır.');
        isValid = false;
    }

    // Yeni şifrenin uzunluğu kontrolü
    if (newPassword.length < 6) {
        showError('newPasswordError', 'Yeni şifre en az 6 karakter olmalıdır.');
        isValid = false;
    }

    // Yeni şifre ve onay şifresinin eşleşmesi kontrolü
    if (newPassword !== confirmNewPassword) {
        showError('confirmNewPasswordError', 'Şifreler eşleşmiyor.');
        isValid = false;
    }

    if (isValid) {
        // Şifre değiştirme işlemi başarılı
        console.log('Şifre başarıyla değiştirildi.');
        alert('Şifreniz başarıyla güncellendi!');
    }
});
