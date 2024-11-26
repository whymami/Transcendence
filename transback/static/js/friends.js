document.addEventListener('DOMContentLoaded', function() {
    loadPendingRequests();
});

function loadPendingRequests() {
    fetch('/api/friends/', {
        headers: {
            'Authorization': `Bearer ${getCookie('access_token')}`
        }
    })
    .then(response => response.json())
    .then(data => {
        updatePendingRequests(data.pending_requests);
    })
    .catch(error => console.error('Error:', error));
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
            loadPendingRequests(); // Refresh the list
        } else {
            showToast('error', data.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('error', '{% trans "An error occurred" %}');
    });
} 