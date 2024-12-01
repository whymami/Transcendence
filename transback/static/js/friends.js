async function actionFriend(username, action) {
    const token = await getAccessToken();

    try {
        let response = await fetch('/api/friends/response/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ username: username, action: action })
        });
        if (response.ok) {
            response = await response.json();
            showToast('success', response.message || gettext('Friend request sent'));
            urlLocationHandler();
        } else {
            response = await response.json();
            showToast('error', response?.error || gettext('An error occurred'));
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('error', error?.error || gettext('An error occurred'));
    }
}

