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
            body: JSON.stringify({
                username: username
            })
        });
        if (response.ok) {
            response = await response.json();
            showToast('success', response.message || gettext('Arkadaşlık isteği gönderildi'));
            const query = window.location.search;
            history.pushState({}, '', window.location.pathname + query);
            urlLocationHandler();
        } else {
            response = await response.json();
            showToast('error', response?.error || gettext('Bir hata oluştu'));
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('error', error?.error || gettext('Bir hata oluştu'));
    }
}

async function sendFriend(username, status) {
    if (status == "accepted")
        status = "remove";
    else if (status == "rejected")
        status = "accept";
    else if (status == "None")
        return sendFriendRequest(username);
    else
        return;

    token = await getCookie('access_token');
    try {
        let response = await fetch('/api/friends/response/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                username: username,
                action: status
            })
        });
        if (response.ok) {
            response = await response.json();
            showToast('success', response.message || gettext('Friend request sent'));
            const query = window.location.search;
            history.pushState({}, '', window.location.pathname + query);
            urlLocationHandler();
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

const urlParams = new URLSearchParams(window.location.search);
const username = urlParams.get('username');
if (username) {
    checkUserOnlineStatus(username);

    setInterval(() => {
        checkUserOnlineStatus(username);
    }, 1000);

    statusSocket.onclose = function () {
        console.log("WebSocket bağlantısı koptu, yeniden bağlanılıyor...");
        setTimeout(() => {
            connectWebSocket();
            checkUserOnlineStatus(username);
        }, 1000);
    };
}
