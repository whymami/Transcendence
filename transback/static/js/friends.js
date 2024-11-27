async function removeFriend(username) {
    token = getCookie('access_token');
    try {
        let response = await fetch('/api/friends/remove/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ username: username })
        });
        if (response.ok) {
            response = await response.json();
            showToast('success', response.message || gettext('Friend removed'));
        } else {
            response = await response.json();
            showToast('error', response?.error || gettext('An error occurred'));
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('error', error?.error || gettext('An error occurred'));
    }
}
