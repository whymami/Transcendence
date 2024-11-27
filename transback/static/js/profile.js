const friendshipButton = document.getElementById('friendshipButton');
async function sendFriendRequest(username) {
    token = await getCookie('access_token');
    try {
        let response = await fetch('/api/friends/request/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ username: username })
        });
        if (response.ok) {
            response = await response.json();
            showToast('success', response.message || gettext('Friend request sent'));
            friendshipButton.disabled = true;
            friendshipButton.textContent = gettext('Pending');
        } else {
            response = await response.json();
            showToast('error', response?.error || gettext('An error occurred'));
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('error', error?.error || gettext('1An error occurred'));
    }
}

const settingsLink = document.getElementById('settings-link');
settingsLink?.addEventListener('click', () => {
    history.pushState({}, '', '/settings');
    urlLocationHandler();
});
