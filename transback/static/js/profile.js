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
});