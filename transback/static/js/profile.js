// Profil Resmi Yükleme
document.getElementById('uploadProfilePic').addEventListener('change', async function (event) {
    const file = event.target.files[0];
    if (file) {
        const validImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!validImageTypes.includes(file.type)) {
            showError('profilePicError', "Lütfen geçerli bir resim dosyası seçin (JPEG, PNG, GIF).");
            return;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
            document.getElementById('profilePic').src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// Profil resmi yükleme butonunu tetikle
document.getElementById('choosePicBtn').addEventListener('click', function () {
    document.getElementById('uploadProfilePic').click();
});

// Hata mesajını gösterme fonksiyonu
function showError(elementId, message) {
    document.getElementById(elementId).textContent = message;
}

// Hata mesajını temizleme fonksiyonu
function clearError(elementId) {
    document.getElementById(elementId).textContent = '';
}

// Form gönderildiğinde
document.getElementById('userSettingsForm').addEventListener('submit', async function (event) {
    event.preventDefault();

    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const profilePic = document.getElementById('uploadProfilePic').files[0];

    let isValid = true;

    clearError('usernameError');
    clearError('emailError');
    clearError('profilePicError');

    // Kullanıcı adı kontrolü
    if (username.length < 4) {
        showError('usernameError', "Kullanıcı adı en az 4 karakter olmalıdır.");
        isValid = false;
    }

    // E-posta kontrolü
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        showError('emailError', "Geçerli bir e-posta adresi girin.");
        isValid = false;
    }

    const token = getCookie('access_token');

    if (isValid) {
        try {
            // FormData nesnesi oluştur
            const formData = new FormData();
            formData.append('username', username);
            formData.append('email', email);

            if (profilePic) {
                formData.append('profile_picture', profilePic);
            }

            // Fetch ile POST isteği gönder
            const response = await fetch('/api/profile/', {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json',
                    "Authorization": "Bearer " + token
                }
            });

            const result = await response.json();

            if (response.ok) {
                console.log("Profil başarıyla güncellendi:", result);
                alert("Ayarlar başarıyla kaydedildi!");
            } else {
                console.error("Hata:", result);
                alert("Bir hata oluştu: " + (result.message || 'Bilinmeyen hata'));
            }
        } catch (error) {
            console.error("Fetch Hatası:", error);
            alert("Bir hata oluştu: " + error.message);
        }
    }
});
