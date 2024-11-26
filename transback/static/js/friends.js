document.addEventListener('DOMContentLoaded', function() {
    loadFriends();
    
    // Event listener for send friend request button
    document.getElementById('sendFriendRequest').addEventListener('click', sendFriendRequest);
});

function loadFriends() {
    fetch('/api/friends/', {
        headers: {
            'Authorization': `Bearer ${getCookie('access_token')}`
        }
    })
    .then(response => response.json())
    .then(data => {
        updateFriendsList(data.friends);
        updatePendingRequests(data.pending_requests);
    })
    .catch(error => console.error('Error:', error));
}

function updateFriendsList(friends) {
    const friendsList = document.getElementById('friendsList');
    friendsList.innerHTML = '';

    friends.forEach(friendship => {
        const friend = friendship.sender.username === getCurrentUsername() 
            ? friendship.receiver 
            : friendship.sender;

        const friendElement = document.createElement('div');
        friendElement.className = 'friend-item';
        friendElement.innerHTML = `
            <div class="friend-info">
                <span class="online-status ${friend.is_online ? 'online' : 'offline'}"></span>
                <span>${friend.username}</span>
                <small class="text-muted">
                    (${friend.games_won}/${friend.games_played} wins)
                </small>
            </div>
            <div class="friend-actions">
                <button class="btn btn-sm btn-primary invite-game" 
                        data-username="${friend.username}">
                    {% trans "Invite to Game" %}
                </button>
            </div>
        `;
        friendsList.appendChild(friendElement);
    });

    if (friends.length === 0) {
        friendsList.innerHTML = '<div class="text-center p-3">{% trans "No friends yet" %}</div>';
    }
}

function updatePendingRequests(requests) {
    const pendingList = document.getElementById('pendingRequests');
    pendingList.innerHTML = '';

    requests.forEach(request => {
        const requestElement = document.createElement('div');
        requestElement.className = 'friend-item';
        requestElement.innerHTML = `
            <div class="friend-info">
                <span>${request.sender.username}</span>
            </div>
            <div class="friend-actions">
                <button class="btn btn-sm btn-success" 
                        onclick="respondToRequest('${request.id}', 'accept')">
                    {% trans "Accept" %}
                </button>
                <button class="btn btn-sm btn-danger" 
                        onclick="respondToRequest('${request.id}', 'reject')">
                    {% trans "Reject" %}
                </button>
            </div>
        `;
        pendingList.appendChild(requestElement);
    });

    if (requests.length === 0) {
        pendingList.innerHTML = '<div class="text-center p-3">{% trans "No pending requests" %}</div>';
    }
}

function sendFriendRequest() {
    const username = document.getElementById('friendUsername').value;
    
    fetch('/api/friends/request/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getCookie('access_token')}`
        },
        body: JSON.stringify({ username: username })
    })
    .then(response => response.json())
    .then(data => {
        if (response.ok) {
            showToast('success', data.message);
            document.getElementById('friendUsername').value = '';
        } else {
            showToast('error', data.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('error', '{% trans "An error occurred" %}');
    });
}

function respondToRequest(requestId, action) {
    fetch('/api/friends/response/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getCookie('access_token')}`
        },
        body: JSON.stringify({
            request_id: requestId,
            action: action
        })
    })
    .then(response => response.json())
    .then(data => {
        if (response.ok) {
            showToast('success', data.message);
            loadFriends(); // Refresh the lists
        } else {
            showToast('error', data.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('error', '{% trans "An error occurred" %}');
    });
}

function getCurrentUsername() {
    // Implement this based on how you store the current user's information
    // For example, you might store it in localStorage or get it from a global variable
    return localStorage.getItem('username');
}

// Assuming you have a toast notification system
function showToast(type, message) {
    // Implement this based on your toast notification system
    // For example, using Bootstrap's toast:
    const toastElement = document.createElement('div');
    toastElement.className = `toast ${type === 'success' ? 'bg-success' : 'bg-danger'} text-white`;
    toastElement.setAttribute('role', 'alert');
    toastElement.setAttribute('aria-live', 'assertive');
    toastElement.setAttribute('aria-atomic', 'true');
    
    toastElement.innerHTML = `
        <div class="toast-header">
            <strong class="me-auto">${type === 'success' ? 'Success' : 'Error'}</strong>
            <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body">
            ${message}
        </div>
    `;
    
    document.body.appendChild(toastElement);
    const toast = new bootstrap.Toast(toastElement);
    toast.show();
    
    // Remove the toast after it's hidden
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
} 