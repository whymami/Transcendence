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

document.getElementById('choosePicBtn').addEventListener('click', function () {
    document.getElementById('uploadProfilePic').click();
});

function showError(elementId, message) {
    document.getElementById(elementId).textContent = message;
}

function clearError(elementId) {
    document.getElementById(elementId).textContent = '';
}

document.getElementById('userSettingsForm').addEventListener('submit', async function (event) {
    event.preventDefault();

    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const profilePicInput = document.getElementById('uploadProfilePic');
    const saveBtn = document.getElementById('save-btn')[0];
    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();
    const profilePic = profilePicInput.files[0];

    let isValid = true;

    clearError('usernameError');
    clearError('emailError');
    clearError('profilePicError');

    if (username.length < 4) {
        showError('usernameError', "Kullanıcı adı en az 4 karakter olmalıdır.");
        isValid = false;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        showError('emailError', "Geçerli bir e-posta adresi girin.");
        isValid = false;
    }

    const token = getCookie('access_token');

    if (isValid) {
        try {
            usernameInput.disabled = true;
            emailInput.disabled = true;
            profilePicInput.disabled = true;
            saveBtn.disabled = true;
            saveBtn.textContent = gettext("saving...");

            const formData = new FormData();
            formData.append('username', username);
            formData.append('email', email);

            if (profilePic) {
                formData.append('profile_picture', profilePic);
            }

            const response = await fetch('/api/settings/', {
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
                showToast("success", "Ayarlar başarıyla kaydedildi!");
            } else {
                console.error("Hata:", result);
                showToast("error", "Bir hata oluştu: " + (result?.message || result?.detail || 'Bilinmeyen hata'));
            }
        } catch (error) {
            console.error("Fetch Hatası:", error);
            showToast("error", "Bir hata oluştu: " + error.message);
        } finally {
            usernameInput.disabled = false;
            emailInput.disabled = false;
            profilePicInput.disabled = false;
        }
    }
});
