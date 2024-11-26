{
    const users = document.querySelectorAll('.user-card');
    users.forEach(user => {
        user.addEventListener('click', () => {
            history.pushState({}, "", "/profile?username="+ user.querySelectorAll('.username')[0].textContent);
            urlLocationHandler();
        });
    });
}