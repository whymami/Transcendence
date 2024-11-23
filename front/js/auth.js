async function refreshAccessToken() {
    const refreshToken = getCookie('refresh_token');

    if (!refreshToken) {
        alert('Session expired, please log in again.');
        history.pushState({}, "", "/login");
        urlLocationHandler();
        return;
    }

    try {
        const response = await fetch('/api/token/refresh/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ refresh: refreshToken })
        });

        if (response.ok) {
            const data = await response.json();
            setCookie('access_token', data.access, 1); // Access token'i güncelle
        } else {
            deleteCookie('access_token');
            deleteCookie('refresh_token');
            history.pushState({}, "", "/login");
            urlLocationHandler();
        }
    } catch (error) {
        console.error('Error refreshing token:', error);
        history.pushState({}, "", "/login");
        urlLocationHandler();
    }
}
