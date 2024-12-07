async function actionFriend(username, action) {
    const token = await getAccessToken();

    const lang = await getCookie('lang') || 'en-US';

    try {
        let response = await fetch('/api/friends/response/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                "Accept-Language": lang,

            },
            body: JSON.stringify({ username: username, action: action })
        });
        if (response.ok) {
            response = await response.json();
            showToast('success', response?.message || gettext('Friend request sent'));
            urlLocationHandler();
        } else {
            response = await response.json();
            showToast('error', response?.error || response?.message  || gettext('An error occurred'));
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('error', error?.error || error?.message  || gettext('An error occurred'));
    }
}

