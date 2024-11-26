document.addEventListener("DOMContentLoaded", function () {
    const socket = new WebSocket('ws://yourserveraddress/ws/online_status/');

    socket.onmessage = function (event) {
        const data = JSON.parse(event.data);
        if (data.username === "{{ user.username }}") {
            updateUserOnlineStatus(data.username, data.status === "online");
        }
    };

    function updateUserOnlineStatus(username, isOnline) {
        const statusElement = document.querySelector(".status span");
        if (isOnline) {
            statusElement.classList.add("online");
            statusElement.classList.remove("offline");
            statusElement.textContent = "{% trans 'Online' %}";
        } else {
            statusElement.classList.add("offline");
            statusElement.classList.remove("online");
            statusElement.textContent = "{% trans 'Offline' %}";
        }
    }

    const addFriendButton = document.getElementById('addFriendButton');
    if (addFriendButton) {
        addFriendButton.addEventListener('click', function() {
            const username = addFriendButton.getAttribute('data-username');
            sendFriendRequest(username);
        });
    }
});

function sendFriendRequest(username) {
    token = getCookie('access_token');
    fetch('/api/friends/request/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ username: username })
    })
    .then(response => response.json())
    .then(data => {
        if (response.ok) {
            showToast('success', data.message);
        } else {
            showToast('error', data.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('error', '{% trans "An error occurred" %}');
    });
}