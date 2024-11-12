// Profil Resmi Yükleme (Binary ArrayBuffer Formatında)
document.getElementById('uploadProfilePic').addEventListener('change', async function(event) {
    const file = event.target.files[0];
    if (file) {
        const validImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!validImageTypes.includes(file.type)) {
            showError('profilePicError', "Lütfen geçerli bir görüntü dosyası seçin (JPEG, PNG, GIF).");
            return;
        }

        const arrayBuffer = await file.arrayBuffer();
        console.log("Resim Binary ArrayBuffer:", arrayBuffer);

        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('profilePic').src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// Hata mesajını gösterme fonksiyonu
function showError(elementId, message) {
    document.getElementById(elementId).textContent = message;
}

// Hata mesajını temizleme fonksiyonu
function clearError(elementId) {
    document.getElementById(elementId).textContent = '';
}

document.getElementById('userSettingsForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    let isValid = true;

    clearError('usernameError');
    clearError('emailError');
    clearError('passwordError');
    clearError('confirmPasswordError');

    if (username.length < 4) {
        showError('usernameError', "Kullanıcı adı en az 4 karakter olmalıdır.");
        isValid = false;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        showError('emailError', "Geçerli bir e-posta adresi girin.");
        isValid = false;
    }

    if (password.length < 6) {
        showError('passwordError', "Şifre en az 6 karakter olmalıdır.");
        isValid = false;
    }

    if (password !== confirmPassword) {
        showError('confirmPasswordError', "Şifreler eşleşmiyor.");
        isValid = false;
    }

    if (isValid) {
        console.log("Kullanıcı Adı:", username);
        console.log("E-posta:", email);
        console.log("Şifre:", password);

        showToast("success", "Ayarlar başarıyla kaydedildi!");
    }
});
