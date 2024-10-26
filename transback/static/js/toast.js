function showToast(type, message) {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    
    const toastContent = document.createElement('div');
    toastContent.className = 'toast-content';
    toastContent.textContent = message;
    
    const closeButton = document.createElement('button');
    closeButton.className = 'toast-close';
    closeButton.innerHTML = '&times;';
    closeButton.onclick = function() {
        removeToast(toast);
    };
    
    toast.appendChild(toastContent);
    toast.appendChild(closeButton);
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        removeToast(toast);
    }, 50000000);
}

function removeToast(toast) {
    toast.classList.add('hide');
    toast.classList.remove('show');
    setTimeout(() => {
        toast.remove();
    }, 300);
}