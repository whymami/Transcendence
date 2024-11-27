document.getElementById('uploadProfilePic').addEventListener('change', async function (event) {
    const file = event.target.files[0];
    if (file) {
        const validImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!validImageTypes.includes(file.type)) {
            showError('profilePicError', gettext("Please select a valid image file (JPEG, PNG, GIF)."));
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
    const profilePicInput = document.getElementById('uploadProfilePic');
    const saveBtn = document.getElementsByClassName('save-btn')[0];
    const emailInput = document.getElementById('email');
    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();
    const profilePic = profilePicInput.files[0];

    let isValid = true;

    clearError('usernameError');
    clearError('emailError');
    clearError('profilePicError');

    if (username.length < 4) {
        showError('usernameError', gettext("Username must be at least 4 characters long."));
        isValid = false;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        showError('emailError', gettext("Please enter a valid email address."));
        isValid = false;
    }

    const token = getCookie('access_token');

    if (isValid) {
        try {
            const oldEmail = emailInput.getAttribute('data-original-email');
            const oldUsername = usernameInput.getAttribute('data-original-username');
            usernameInput.disabled = true;
            emailInput.disabled = true;
            profilePicInput.disabled = true;
            saveBtn.disabled = true;
            saveBtn.textContent = gettext("Saving...");

            if (email === oldEmail) {
                email = "";
            }

            if (username === oldUsername) {
                username = "";
            }

            const formData = new FormData();
            formData.append('username', username);
            formData.append('email', email);

            if (profilePic) {
                formData.append('profile_picture', profilePic);
            } else {
                formData.append('profile_picture', "");
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
                console.log(gettext("Profile updated successfully:"), result);
                showToast("success", gettext("Settings saved successfully!"));
            } else {
                console.error(gettext("Error:"), result);
                showToast("error", gettext("An error occurred: ") + (result?.message || result?.detail || gettext('Unknown error')));
            }
        } catch (error) {
            console.error("Fetch Hatası:", error);
            showToast("error", error.message);
        } finally {
            usernameInput.disabled = false;
            emailInput.disabled = false;
            profilePicInput.disabled = false;
            saveBtn.disabled = false;
            saveBtn.textContent = gettext("Save");
        }
    }
});
